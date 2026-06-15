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

    const results = response.data;
    const labels  = results.map((r) => r.label.toLowerCase());
    const isFake  = FAKE_LABELS.some((f) => labels.slice(0, 5).some((l) => l.includes(f)));

    if (isFake) return res.json({
      status: 'NOT_REAL', isRealPhoto: false, isRelevant: false,
      message: `Fake image detected (${results[0]?.label}) — upload a real photo`,
      detectedLabels: labels.slice(0, 5), mock: false,
    });

    let isRelevant   = true;
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
