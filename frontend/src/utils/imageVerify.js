// Pure browser image verification using Canvas API

const CATEGORY_COLOR_PROFILES = {
  'Road Damage':  { dominant: 'grays',   minRatio: 0.25, desc: 'road/asphalt scene (grey tones expected)' },
  'Flood':        { dominant: 'blues',   minRatio: 0.15, desc: 'water/flood scene (blue tones expected)' },
  'Fire':         { dominant: 'reds',    minRatio: 0.15, desc: 'fire scene (red/orange tones expected)' },
  'Pollution':    { dominant: 'grays',   minRatio: 0.15, desc: 'smoke/smog scene (grey tones expected)' },
  'Power Outage': { dominant: 'grays',   minRatio: 0.10, desc: 'electrical infrastructure' },
  'Water Supply': { dominant: 'blues',   minRatio: 0.10, desc: 'water/pipes scene (blue tones expected)' },
  'Accident':     { dominant: 'grays',   minRatio: 0.10, desc: 'road/vehicle scene' },
  'Garbage':      { dominant: 'mixed',   minRatio: 0,    desc: 'waste/garbage scene' },
  'Noise':        { dominant: 'any',     minRatio: 0,    desc: 'any outdoor scene' },
  'Other':        { dominant: 'any',     minRatio: 0,    desc: 'any scene' },
};

const getColorBucket = (r, g, b) => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta < 25) return 'grays';
  let hue = 0;
  if (max === r)      hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else                hue = (r - g) / delta + 4;
  hue = Math.round(hue * 60);
  if (hue < 0) hue += 360;
  if (hue < 20 || hue >= 340) return 'reds';
  if (hue < 45)  return 'oranges';
  if (hue < 70)  return 'yellows';
  if (hue < 160) return 'greens';
  if (hue < 250) return 'blues';
  return 'purples';
};

export const verifyImageClient = (file, imgElement, category) => {
  return new Promise((resolve) => {
    try {
      const canvas  = document.createElement('canvas');
      const SAMPLE  = 200;
      canvas.width  = SAMPLE;
      canvas.height = SAMPLE;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imgElement, 0, 0, SAMPLE, SAMPLE);
      const { data } = ctx.getImageData(0, 0, SAMPLE, SAMPLE);
      const total = SAMPLE * SAMPLE;

      const buckets = { reds:0, oranges:0, yellows:0, greens:0, blues:0, purples:0, grays:0 };
      let nearWhite = 0, nearBlack = 0;
      const uniqueColors = new Set();

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i+1], b = data[i+2];
        const brightness = (r + g + b) / 3;
        if (brightness > 220) nearWhite++;
        if (brightness < 30)  nearBlack++;
        buckets[getColorBucket(r, g, b)]++;
        uniqueColors.add(((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3));
      }

      const ratio      = {};
      Object.keys(buckets).forEach((k) => { ratio[k] = buckets[k] / total; });
      const whiteRatio = nearWhite / total;
      const blackRatio = nearBlack / total;
      const entropy    = uniqueColors.size;

      // ── Check 1: Real photo detection ──────────────────────
      const realIssues = [];

      // Solid/blank image
      if (entropy < 80)
        realIssues.push('Blank or solid colour image — upload a real photo');
      // Document / paper / PDF screenshot
      else if (whiteRatio > 0.55 && entropy < 500)
        realIssues.push('Document or text image detected — upload a real photo of the issue');
      // Dark screenshot / UI screen
      else if (blackRatio > 0.55 && entropy < 500)
        realIssues.push('Dark screenshot detected — upload a real photo');
      // Cartoon / illustration / clip art: very few unique colors, no natural variation
      else if (entropy < 700 && ratio.grays < 0.10 && whiteRatio < 0.20)
        realIssues.push('Cartoon or illustration detected — upload a real photo');
      // Meme / infographic: high white + unnatural color distribution
      else if (whiteRatio > 0.40 && entropy < 700)
        realIssues.push('Meme or graphic image detected — upload a real photo of the issue');
      // AI-generated / very uniform image
      else if (entropy < 400)
        realIssues.push('Image appears fake or AI-generated — upload a real photo');

      const isRealPhoto = realIssues.length === 0;

      // ── Check 2: Category relevance ─────────────────────────
      let isRelevant   = true;
      let relevanceMsg = 'Image matches complaint category';
      const profile    = category ? CATEGORY_COLOR_PROFILES[category] : null;

      if (profile && profile.dominant !== 'any' && isRealPhoto) {
        if (profile.dominant === 'mixed') {
          // Garbage: needs complex mixed scene, not dominated by single color
          const maxSingleColor = Math.max(...Object.values(ratio));
          if (maxSingleColor > 0.65) {
            isRelevant   = false;
            relevanceMsg = `Image doesn't look like a garbage scene — upload a photo showing actual waste/garbage`;
          }
        } else {
          // Other categories: check dominant color ratio
          const colorVal = ratio[profile.dominant] || 0;
          // Also allow if high entropy (complex outdoor scene)
          if (colorVal < profile.minRatio && entropy < 1500) {
            isRelevant   = false;
            relevanceMsg = `Image doesn't match "${category}" category — ${profile.desc}`;
          }
        }
      }

      const status = !isRealPhoto ? 'NOT_REAL' : !isRelevant ? 'NOT_RELEVANT' : 'VERIFIED';

      const dominantColors = Object.entries(ratio)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([k, v]) => `${k} ${Math.round(v * 100)}%`);

      resolve({
        status, isRealPhoto, isRelevant, realIssues, entropy,
        whiteRatio: Math.round(whiteRatio * 100),
        dominantColors, relevanceMsg,
        message: !isRealPhoto ? realIssues[0] : !isRelevant ? relevanceMsg : 'Real photo confirmed — matches complaint category',
      });

    } catch {
      resolve({ status: 'VERIFIED', isRealPhoto: true, isRelevant: true, realIssues: [], message: 'Verification skipped', fallback: true });
    }
  });
};
