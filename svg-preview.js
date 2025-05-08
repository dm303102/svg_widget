document.addEventListener('DOMContentLoaded', () => {
  let uploadedSvgText = null;
  const fileInput   = document.getElementById('fileInput');
  const widthInput  = document.getElementById('widthInput');
  const heightInput = document.getElementById('heightInput');
  const renderBtn   = document.getElementById('renderBtn');
  const dims        = document.getElementById('dimensions');
  const preview     = document.getElementById('preview');
  const staticImg   = document.getElementById('staticPreview');

  // Read file & show live preview
  fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      uploadedSvgText = evt.target.result;
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(uploadedSvgText, 'image/svg+xml');
      const svgEl  = svgDoc.documentElement;

      let w = svgEl.getAttribute('width');
      let h = svgEl.getAttribute('height');
      if (!w || !h) {
        const vb = svgEl.getAttribute('viewBox');
        if (vb) {
          const parts = vb.split(' ');
          w = parts[2]; h = parts[3];
        }
      }
      dims.textContent  = `Width: ${w}px Height: ${h}px`;
      preview.innerHTML = uploadedSvgText;
    };
    reader.readAsText(file);
  });

  // Generate static preview on button click
  renderBtn.addEventListener('click', () => {
    if (!uploadedSvgText) {
      alert('Please upload an SVG first!');
      return;
    }
    const wIn = parseFloat(widthInput.value);
    const hIn = parseFloat(heightInput.value);
    if (!(wIn > 0 && hIn > 0)) {
      alert('Enter valid width/height in inches.');
      return;
    }
    const DPI = 96;
    const wPx = Math.round(wIn * DPI);
    const hPx = Math.round(hIn * DPI);
    drawSvgWithBorder(uploadedSvgText, wPx, hPx, 6);
  });

  // Draw SVG with border and aspect-fit
  function drawSvgWithBorder(svgText, wPx, hPx, borderPx = 4) {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
    const svgEl  = svgDoc.documentElement;
    let origW = parseFloat(svgEl.getAttribute('width'));
    let origH = parseFloat(svgEl.getAttribute('height'));
    if (!origW || !origH) {
      const vb = svgEl.getAttribute('viewBox')?.split(' ');
      origW = parseFloat(vb?.[2] || wPx);
      origH = parseFloat(vb?.[3] || hPx);
    }
    const scale = Math.min(wPx/origW, hPx/origH);
    const drawW = origW * scale;
    const drawH = origH * scale;

    const canvas = document.createElement('canvas');
    canvas.width  = wPx + borderPx * 2;
    canvas.height = hPx + borderPx * 2;
    const ctx = canvas.getContext('2d');

    // White background
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.lineWidth   = borderPx;
    ctx.strokeStyle = '#000';
    ctx.strokeRect(borderPx/2, borderPx/2, wPx + borderPx, hPx + borderPx);

    // Render SVG onto canvas
    const blob = new Blob([svgText], { type: 'image/svg+xml' });
    const url  = URL.createObjectURL(blob);
    const img  = new Image();
    img.onload = () => {
      const x = borderPx + (wPx - drawW) / 2;
      const y = borderPx + (hPx - drawH) / 2;
      ctx.drawImage(img, x, y, drawW, drawH);
      URL.revokeObjectURL(url);
      staticImg.src = canvas.toDataURL('image/png');
    };
    img.src = url;
  }
});
