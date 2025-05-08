//TODO
function svgTextToPngDataUrl(svgText, w, h, callback) {
  // create a Blob URL for the SVG
  const blob = new Blob([svgText], { type: 'image/svg+xml' });
  const url  = URL.createObjectURL(blob);

  const img = new Image();
  img.onload = () => {
    // draw into canvas at the requested size:
    const canvas = document.createElement('canvas');
    canvas.width  = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);

    // cleanup
    URL.revokeObjectURL(url);

    // give back the PNG data‑URL
    callback(canvas.toDataURL('image/png'));
  };
  img.src = url;
}

if (forcedW && forcedH && uploadedSvgText) {
  svgTextToPngDataUrl(uploadedSvgText, forcedW, forcedH, (pngDataUrl) => {
    // show it:
    const imgEl = document.getElementById('staticPreview');
    imgEl.src = pngDataUrl;
  });
}
