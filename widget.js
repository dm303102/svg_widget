function drawSvgWithBorder(svgText, wPx, hPx, borderPx = 4) {
  // 1. parse the SVG to find its intrinsic size
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
  const svgEl  = svgDoc.documentElement;
  
  // intrinsic width/height either from attributes or viewBox
  let origW = parseFloat(svgEl.getAttribute('width'));
  let origH = parseFloat(svgEl.getAttribute('height'));
  if (!origW || !origH) {
    const vb = svgEl.getAttribute('viewBox')?.split(' ');
    origW = parseFloat(vb?.[2]  || wPx);
    origH = parseFloat(vb?.[3]  || hPx);
  }

  // 2. compute aspect‑fit scale
  const scale = Math.min(wPx/origW, hPx/origH);
  const drawW = origW * scale;
  const drawH = origH * scale;

  // 3. create canvas sized to include border
  const canvas = document.createElement('canvas');
  canvas.width  = wPx + borderPx * 2;
  canvas.height = hPx + borderPx * 2;
  const ctx = canvas.getContext('2d');

  // 4. fill background (optional)
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 5. draw border
  ctx.lineWidth   = borderPx;
  ctx.strokeStyle = '#000';  // or any color
  ctx.strokeRect(
    borderPx/2,
    borderPx/2,
    wPx + borderPx,
    hPx + borderPx
  );

  // 6. draw the SVG image centered inside the border
  const blob = new Blob([svgText], { type: 'image/svg+xml' });
  const url  = URL.createObjectURL(blob);
  const img  = new Image();

  img.onload = () => {
    const x = borderPx + (wPx  - drawW) / 2;
    const y = borderPx + (hPx  - drawH) / 2;
    ctx.drawImage(img, x, y, drawW, drawH);
    URL.revokeObjectURL(url);

    // now you can replace your <img> or preview container:
    document.getElementById('staticPreview')
            .src = canvas.toDataURL('image/png');
  };
  img.src = url;
}

function svgTextToPngDataUrl(svgText, w, h, callback) {
  // create a Blob URL for the SVG
  const blob = new Blob([svgText], { type: 'image/svg+xml' });
  const url  = URL.createObjectURL(blob);
  
  const img = new Image();
  img.onload = () => {
    // draw into canvas at the requested size:
    const canvas = document.createElement('canvas');
    canvas.width  = forcedW;
    canvas.height = forcedH;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);

    // cleanup
    URL.revokeObjectURL(url);

    // give back the PNG data‑URL
    callback(canvas.toDataURL('image/png'));
  };
  img.src = url;
}

const DPI = 96;    // or 300 for print‑resolution previews
// assume widthInput/heightInput.value hold inches, e.g. “3.5” for 3½″
const wIn  = parseFloat(widthInput.value);
const hIn  = parseFloat(heightInput.value);
const wPx  = Math.round(wIn * DPI);
const hPx  = Math.round(hIn * DPI);

  // parse ?width=500&height=300 from the URL
  const params = new URLSearchParams(window.location.search);
  const forcedW = parseInt(params.get('width'));
  const forcedH = parseInt(params.get('height'));

if (forcedW && forcedH && uploadedSvgText) {
  svgTextToPngDataUrl(uploadedSvgText, forcedW, forcedH, (pngDataUrl) => {
    // show it:
    const imgEl = document.getElementById('staticPreview');
    imgEl.src = pngDataUrl;
  });
}
