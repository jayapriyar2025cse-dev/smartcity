const HF_TOKEN = process.env.REACT_APP_HF_TOKEN;
const HF_MODEL = 'https://api-inference.huggingface.co/models/google/vit-base-patch16-224';

const CATEGORY_KEYWORDS = {
  'Garbage':      ['garbage', 'trash', 'waste', 'litter', 'dump', 'rubbish', 'debris', 'bin', 'refuse', 'compost'],
  'Road Damage':  ['road', 'pothole', 'asphalt', 'pavement', 'street', 'highway', 'crack', 'concrete', 'sidewalk'],
  'Flood':        ['flood', 'water', 'river', 'lake', 'ocean', 'puddle', 'rain', 'drainage', 'stream', 'wet'],
  'Fire':         ['fire', 'flame', 'smoke', 'burn', 'blaze', 'explosion', 'campfire', 'torch'],
  'Pollution':    ['smoke', 'smog', 'pollution', 'factory', 'chimney', 'exhaust', 'fume', 'haze', 'dust'],
  'Power Outage': ['wire', 'cable', 'electricity', 'pole', 'transformer', 'electric', 'power', 'line'],
  'Water Supply': ['pipe', 'water', 'plumbing', 'leak', 'tap', 'drain', 'sewage', 'faucet'],
  'Accident':     ['accident', 'car', 'vehicle', 'crash', 'truck', 'bus', 'motorcycle', 'collision', 'ambulance'],
  'Noise':        ['crowd', 'concert', 'speaker', 'music', 'street', 'people', 'party'],
  'Other':        [],
};

const FAKE_IMAGE_LABELS = [
  'comic book', 'cartoon', 'illustration', 'drawing', 'anime', 'painting',
  'meme', 'screenshot', 'website', 'document', 'text', 'poster', 'banner',
  'advertisement', 'graphic', 'wallpaper', 'art', 'sketch', 'clipart',
];

export const verifyImageClient = async (file, imgElement, category) => {
  try {
    // Convert file to base64
    const base64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result.split(',')[1]);
      reader.readAsDataURL(file);
    });

    // Call Hugging Face API
    const response = await fetch(HF_MODEL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: base64 }),
    });

    if (!response.ok) throw new Error('API failed');

    const results = await response.json();
    // results = [{ label: 'cat', score: 0.95 }, ...]
    const labels = results.map((r) => r.label.toLowerCase());
    const topLabel = labels[0] || '';

    // Check 1: Is it a fake/non-real image?
    const isFake = FAKE_IMAGE_LABELS.some((f) => labels.slice(0, 5).some((l) => l.includes(f)));
    if (isFake) {
      return {
        status: 'NOT_REAL',
        isRealPhoto: false,
        isRelevant: false,
        realIssues: [`Fake or non-real image detected (${topLabel}) — upload a real photo`],
        message: `Fake or non-real image detected — upload a real photo of the issue`,
        dominantColors: [],
        relevanceMsg: '',
        entropy: 0,
      };
    }

    // Check 2: Does image match category?
    let isRelevant = true;
    let relevanceMsg = 'Image matches complaint category';

    if (category && category !== 'Other') {
      const keywords = CATEGORY_KEYWORDS[category] || [];
      const matched  = keywords.some((k) => labels.slice(0, 10).some((l) => l.includes(k)));
      if (!matched) {
        isRelevant   = false;
        relevanceMsg = `Image doesn't match "${category}" category — detected: ${results.slice(0, 3).map(r => r.label).join(', ')}`;
      }
    }

    return {
      status: isRelevant ? 'VERIFIED' : 'NOT_RELEVANT',
      isRealPhoto: true,
      isRelevant,
      realIssues: [],
      message: isRelevant
        ? `Real photo verified — detected: ${results.slice(0, 2).map(r => r.label).join(', ')}`
        : relevanceMsg,
      dominantColors: results.slice(0, 3).map((r) => `${r.label} ${Math.round(r.score * 100)}%`),
      relevanceMsg,
      entropy: 9999,
    };

  } catch {
    // Fallback to canvas if API fails
    return verifyImageCanvas(imgElement, category);
  }
};

// Canvas fallback
const verifyImageCanvas = (imgElement, category) => {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 200; canvas.height = 200;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imgElement, 0, 0, 200, 200);
      const { data } = ctx.getImageData(0, 0, 200, 200);
      const uniqueColors = new Set();
      let nearWhite = 0;
      for (let i = 0; i < data.length; i += 4) {
        if ((data[i] + data[i+1] + data[i+2]) / 3 > 220) nearWhite++;
        uniqueColors.add(((data[i] >> 3) << 10) | ((data[i+1] >> 3) << 5) | (data[i+2] >> 3));
      }
      const entropy    = uniqueColors.size;
      const whiteRatio = nearWhite / 40000;
      const isFake     = entropy < 200 || (whiteRatio > 0.6 && entropy < 500);
      resolve({
        status: isFake ? 'NOT_REAL' : 'VERIFIED',
        isRealPhoto: !isFake,
        isRelevant: true,
        realIssues: isFake ? ['Image appears fake — upload a real photo'] : [],
        message: isFake ? 'Image appears fake — upload a real photo' : 'Image verified (offline mode)',
        dominantColors: [],
        relevanceMsg: 'Verified in offline mode',
        entropy,
        fallback: true,
      });
    } catch {
      resolve({ status: 'VERIFIED', isRealPhoto: true, isRelevant: true, realIssues: [], message: 'Verification skipped', fallback: true, entropy: 0, dominantColors: [], relevanceMsg: '' });
    }
  });
};
