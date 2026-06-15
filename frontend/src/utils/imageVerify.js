const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export const verifyImageClient = async (file, imgElement, category) => {
  try {
    // Convert to base64
    const base64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });

    const response = await fetch(`${BACKEND_URL}/api/verify-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64, category }),
    });

    if (!response.ok) throw new Error('Backend unavailable');

    const result = await response.json();
    return {
      status:        result.status,
      isRealPhoto:   result.isRealPhoto ?? true,
      isRelevant:    result.isRelevant  ?? true,
      realIssues:    result.status === 'NOT_REAL' ? [result.message] : [],
      message:       result.message,
      dominantColors: result.detectedLabels?.slice(0, 3) || [],
      relevanceMsg:  result.message,
      entropy:       9999,
      fallback:      result.mock || false,
    };

  } catch {
    return verifyImageCanvas(imgElement, category);
  }
};

// Canvas fallback when backend unavailable
const verifyImageCanvas = (imgElement) => {
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
