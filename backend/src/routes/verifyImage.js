const express = require('express');
const router  = express.Router();
const axios   = require('axios');

const CATEGORY_KEYWORDS = {
  'Garbage':      ['garbage', 'trash', 'waste', 'litter', 'dump', 'rubbish', 'bin', 'debris'],
  'Road Damage':  ['road', 'pothole', 'crack', 'asphalt', 'pavement', 'street', 'highway'],
  'Flood':        ['flood', 'water', 'rain', 'puddle', 'drainage', 'overflow', 'wet'],
  'Fire':         ['fire', 'flame', 'smoke', 'burn', 'blaze'],
  'Accident':     ['accident', 'crash', 'vehicle', 'car', 'collision', 'traffic'],
  'Pollution':    ['smoke', 'smog', 'pollution', 'factory', 'chimney', 'dust', 'haze'],
  'Power Outage': ['electricity', 'wire', 'pole', 'cable', 'transformer', 'power'],
  'Water Supply': ['pipe', 'water', 'leak', 'drain', 'sewage', 'tap'],
  'Noise':        ['crowd', 'speaker', 'construction', 'machine', 'vehicle'],
  'Other':        [],
};

const FAKE_LABELS = [
  'comic book', 'cartoon', 'illustration', 'drawing', 'anime', 'painting',
  'meme', 'screenshot', 'document', 'poster', 'banner', 'advertisement',
  'graphic', 'art', 'sketch', 'clipart', 'digital art', 'cgi', 'render',
];

// POST /api/verify-image
router.post('/', async (req, res) => {
  const { imageBase64, category = '' } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'imageBase64 required' });

  const HF_TOKEN = process.env.HF_TOKEN;
  if (!HF_TOKEN) return res.json({ status: 'VERIFIED', isRealPhoto: true, isRelevant: true, message: 'Demo mode', mock: true });

  try {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer     = Buffer.from(base64Data, 'base64');

    const response = await axios.post(
      'https://api-inference.huggingface.co/models/google/vit-base-patch16-224',
      buffer,
      { headers: { 'Authorization': `Bearer ${HF_TOKEN}`, 'Content-Type': 'application/octet-stream' }, timeout: 15000 }
    );

    const results  = response.data;
    const labels   = results.map((r) => r.label.toLowerCase());
    const isFake   = FAKE_LABELS.some((f) => labels.slice(0, 5).some((l) => l.includes(f)));

    if (isFake) return res.json({
      status: 'NOT_REAL', isRealPhoto: false, isRelevant: false,
      message: `Fake image detected (${results[0]?.label}) — upload a real photo`,
      detectedLabels: labels.slice(0, 5), mock: false,
    });

    let isRelevant = true;
    let relevanceMsg = 'Image matches complaint category';
    if (category && category !== 'Other') {
      const keywords = CATEGORY_KEYWORDS[category] || [];
      const matched  = keywords.some((k) => labels.slice(0, 10).some((l) => l.includes(k)));
      if (!matched) {
        isRelevant   = false;
        relevanceMsg = `Image doesn't match "${category}" — detected: ${results.slice(0, 3).map(r => r.label).join(', ')}`;
      }
    }

    return res.json({
      status: isRelevant ? 'VERIFIED' : 'NOT_RELEVANT',
      isRealPhoto: true, isRelevant,
      message: isRelevant ? `Verified — ${results.slice(0, 2).map(r => r.label).join(', ')}` : relevanceMsg,
      detectedLabels: labels.slice(0, 5), mock: false,
    });

  } catch (err) {
    return res.json({ status: 'VERIFIED', isRealPhoto: true, isRelevant: true, message: 'Verification unavailable', mock: true, error: err.message });
  }
});

module.exports = router;

// ── Category → relevant Vision label keywords ─────────────────
const CATEGORY_KEYWORDS = {
  'Garbage':      ['garbage', 'trash', 'waste', 'litter', 'dump', 'rubbish', 'bin', 'debris', 'pollution'],
  'Road Damage':  ['road', 'pothole', 'crack', 'asphalt', 'pavement', 'street', 'highway', 'damage', 'broken'],
  'Flood':        ['flood', 'water', 'rain', 'puddle', 'waterlogging', 'drainage', 'overflow', 'wet'],
  'Fire':         ['fire', 'flame', 'smoke', 'burn', 'blaze', 'ash', 'heat'],
  'Accident':     ['accident', 'crash', 'vehicle', 'car', 'collision', 'traffic', 'injury'],
  'Pollution':    ['smoke', 'smog', 'pollution', 'factory', 'chimney', 'dust', 'haze', 'emission'],
  'Power Outage': ['electricity', 'wire', 'pole', 'cable', 'transformer', 'power', 'electric', 'dark'],
  'Water Supply': ['pipe', 'water', 'leak', 'drain', 'sewage', 'tap', 'supply', 'plumbing'],
  'Noise':        ['crowd', 'speaker', 'construction', 'machine', 'vehicle', 'traffic'],
  'Other':        [], // accept anything
};

// Labels that strongly suggest AI-generated / synthetic images
const AI_GENERATED_SIGNALS = [
  'digital art', 'illustration', 'cartoon', 'animation', 'cgi',
  'computer graphics', 'graphic design', 'art', 'drawing', 'painting',
  'fictional character', 'anime', 'render', 'generated', 'artificial',
  'clipart', 'stock photo', 'watermark',
];

// POST /api/verify-image
// Body: { imageBase64: string, title: string, category: string }
router.post('/', async (req, res) => {
  const { imageBase64, title = '', category = '' } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'imageBase64 is required' });

  const VISION_KEY = process.env.GOOGLE_VISION_API_KEY;

  // ── No API key → smart canvas-level mock for demo ────────────
  if (!VISION_KEY) {
    return res.json(buildMockResult(title, category));
  }

  try {
    // Strip data URI prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const response = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${VISION_KEY}`,
      {
        requests: [{
          image: { content: base64Data },
          features: [
            { type: 'LABEL_DETECTION',       maxResults: 20 },
            { type: 'SAFE_SEARCH_DETECTION'                  },
            { type: 'IMAGE_PROPERTIES',      maxResults: 1  },
          ],
        }],
      },
      { timeout: 15000 }
    );

    const result      = response.data.responses[0];
    const labels      = (result.labelAnnotations || []).map((l) => ({
      name:  l.description.toLowerCase(),
      score: l.score,
    }));
    const safeSearch  = result.safeSearchAnnotation || {};
    const labelNames  = labels.map((l) => l.name);

    // ── 1. AI-generated detection ─────────────────────────────
    const aiSignalMatches = AI_GENERATED_SIGNALS.filter((s) =>
      labelNames.some((l) => l.includes(s))
    );
    // safeSearch "medical" / "spoof" likelihood also hints at synthetic
    const spoofLikely = ['LIKELY', 'VERY_LIKELY'].includes(safeSearch.spoof);
    const aiScore     = Math.min(
      1,
      (aiSignalMatches.length * 0.25) + (spoofLikely ? 0.4 : 0)
    );
    const isAiGenerated = aiScore >= 0.4;

    // ── 2. Title / category relevance ─────────────────────────
    const keywords    = CATEGORY_KEYWORDS[category] || [];
    const titleWords  = title.toLowerCase().split(/\s+/);
    const allKeywords = [...keywords, ...titleWords].filter((w) => w.length > 3);

    const matchedLabels = allKeywords.filter((kw) =>
      labelNames.some((l) => l.includes(kw) || kw.includes(l))
    );
    const relevanceScore = allKeywords.length > 0
      ? matchedLabels.length / allKeywords.length
      : 1; // no keywords = can't judge, allow

    const isRelevant = relevanceScore >= 0.15 || allKeywords.length === 0;

    // ── 3. Final verdict ──────────────────────────────────────
    const status = isAiGenerated
      ? 'AI_GENERATED'
      : !isRelevant
        ? 'NOT_RELEVANT'
        : 'VERIFIED';

    return res.json({
      status,
      isAiGenerated,
      isRelevant,
      aiScore:        parseFloat(aiScore.toFixed(2)),
      relevanceScore: parseFloat(relevanceScore.toFixed(2)),
      detectedLabels: labelNames.slice(0, 8),
      matchedKeywords: matchedLabels,
      aiSignals:      aiSignalMatches,
      message:        buildMessage(status, aiSignalMatches, matchedLabels, category),
      verifiedAt:     new Date().toISOString(),
      mock:           false,
    });

  } catch (err) {
    console.error('Vision API error:', err.response?.data || err.message);
    // Graceful fallback — don't block submission if API fails
    return res.json({
      status:         'VERIFIED',
      isAiGenerated:  false,
      isRelevant:     true,
      aiScore:        0,
      relevanceScore: 1,
      detectedLabels: [],
      message:        'Verification service unavailable — image accepted by default',
      verifiedAt:     new Date().toISOString(),
      mock:           true,
      error:          err.message,
    });
  }
});

// ── Mock result when no API key (demo mode) ───────────────────
function buildMockResult(title, category) {
  // Simulate a realistic verified result for demo
  const keywords = CATEGORY_KEYWORDS[category] || [];
  return {
    status:          'VERIFIED',
    isAiGenerated:   false,
    isRelevant:      true,
    aiScore:         parseFloat((Math.random() * 0.15).toFixed(2)),
    relevanceScore:  parseFloat((0.6 + Math.random() * 0.4).toFixed(2)),
    detectedLabels:  keywords.slice(0, 4),
    matchedKeywords: keywords.slice(0, 2),
    aiSignals:       [],
    message:         'Image verified (demo mode — add GOOGLE_VISION_API_KEY for real checks)',
    verifiedAt:      new Date().toISOString(),
    mock:            true,
  };
}

function buildMessage(status, aiSignals, matched, category) {
  if (status === 'AI_GENERATED')
    return `Image appears to be AI-generated or synthetic (signals: ${aiSignals.join(', ')})`;
  if (status === 'NOT_RELEVANT')
    return `Image does not appear to match the "${category}" category. Please upload a relevant photo.`;
  return `Image verified — matches complaint category with ${matched.length} relevant visual elements`;
}

module.exports = router;
