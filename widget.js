document.addEventListener('DOMContentLoaded', () => {
  const images = [];
  let selectedId = null;
  let dragging = false;
  let dragOffset = { x: 0, y: 0 };

  const DPI = 96;
  const borderPx = 4;

  const fileInput = document.getElementById('fileInput');
  const widthInput = document.getElementById('widthInput');
  const heightInput = document.getElementById('heightInput');
  const renderBtn = document.getElementById('renderBtn');
  const scaleSlider = document.getElementById('scaleSlider');
  const scaleValue = document.getElementById('scaleValue');
  const toggleOrient = document.getElementById('toggleOrientation');
  const exportBtn = document.getElementById('exportBtn');
  const exportSvgBtn = document.getElementById('exportSvgBtn');
  const svgList = document.getElementById('svgList');
  const canvas = document.getElementById('mainCanvas');
  const ctx = canvas.getContext('2d');

  function redrawAll() {
    const wIn = parseFloat(widthInput.value);
    const hIn = parseFloat(heightInput.value);
    if (!(wIn > 0 && hIn > 0)) return;
    const wPx = Math.round(wIn * DPI);
    const hPx = Math.round(hIn * DPI);
    canvas.width = wPx + borderPx * 2;
    canvas.height = hPx + borderPx * 2;

    // background & border
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = borderPx;
    ctx.strokeStyle = '#000';
    ctx.strokeRect(borderPx/2, borderPx/2, wPx + borderPx, hPx + borderPx);

    // inch labels
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${wIn}\"`, borderPx + wPx/2, canvas.height - 4);
    ctx.save();
    ctx.translate(canvas.width - 4, borderPx + hPx/2);
    ctx.rotate(Math.PI/2);
    ctx.fillText(`${hIn}\"`, 0, 0);
    ctx.restore();

    // draw SVGs
    images.forEach(item => {
      const drawW = item.origW * item.fitScale * item.scalePercent;
      const drawH = item.origH * item.fitScale * item.scalePercent;
      ctx.drawImage(item.image, item.x, item.y, drawW, drawH);
      if (item.id === selectedId) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'red';
        ctx.strokeRect(item.x, item.y, drawW, drawH);
      }
    });
  }

  function updateList() {
    svgList.innerHTML = '';
    images.forEach((item, index) => {
      const li = document.createElement('li');
      li.dataset.id = item.id;
      if (item.id === selectedId) li.classList.add('selected');
      li.innerHTML = `SVG ${index + 1} <button class="deleteBtn" data-id="${item.id}">Delete</button>`;
      svgList.appendChild(li);
    });
  }

  function selectImage(id) {
    selectedId = id;
    updateList();
    const item = images.find(i => i.id === id);
    if (item) {
      scaleSlider.value = Math.round(item.scalePercent * 100);
      scaleValue.textContent = `${scaleSlider.value}%`;
    }
  }

  svgList.addEventListener('click', e => {
    if (e.target.matches('.deleteBtn')) {
      const id = e.target.dataset.id;
      const idx = images.findIndex(i => i.id === id);
      if (idx >= 0) images.splice(idx, 1);
      if (selectedId === id) selectedId = images[0]?.id || null;
      updateList();
      redrawAll();
      return;
    }
    const li = e.target.closest('li');
    if (li) selectImage(li.dataset.id);
  });

  scaleSlider.addEventListener('input', () => {
    scaleValue.textContent = `${scaleSlider.value}%`;
    const item = images.find(i => i.id === selectedId);
    if (item) {
      item.scalePercent = scaleSlider.value / 100;
      redrawAll();
    }
  });

  renderBtn.addEventListener('click', redrawAll);

  toggleOrient.addEventListener('click', () => {
    [widthInput.value, heightInput.value] = [heightInput.value, widthInput.value];
    toggleOrient.textContent = toggleOrient.textContent.includes('Landscape')
      ? 'Switch to Portrait' : 'Switch to Landscape';
    redrawAll();
  });

  exportBtn.addEventListener('click', () => {
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'canvas-export.png';
    link.click();
  });

  exportSvgBtn.addEventListener('click', () => {
    const wIn = parseFloat(widthInput.value);
    const hIn = parseFloat(heightInput.value);
    if (!(wIn > 0 && hIn > 0)) return;
    const wPx = Math.round(wIn * DPI);
    const hPx = Math.round(hIn * DPI);
    const xmlns = 'http://www.w3.org/2000/svg';
    let svgContent = `<?xml version="1.0" encoding="UTF-8"?>`;
    svgContent += `<svg xmlns="${xmlns}" width="${wPx+borderPx*2}" height="${hPx+borderPx*2}" viewBox="0 0 ${wPx+borderPx*2} ${hPx+borderPx*2}">`;
    svgContent += `<rect x="${borderPx/2}" y="${borderPx/2}" width="${wPx+borderPx}" height="${hPx+borderPx}" fill="none" stroke="black" stroke-width="${borderPx}"/>`;
    svgContent += `<text x="${borderPx + wPx/2}" y="${(hPx+borderPx*2)-4}" font-family="sans-serif" font-size="16" text-anchor="middle">${wIn}\"</text>`;
    svgContent += `<text transform="translate(${wPx+borderPx*2-4},${borderPx + hPx/2}) rotate(90)" font-family="sans-serif" font-size="16" text-anchor="middle">${hIn}\"</text>`;
    images.forEach(item => {
      const drawW = item.origW * item.fitScale * item.scalePercent;
      const drawH = item.origH * item.fitScale * item.scalePercent;
      const parser = new DOMParser();
      const doc = parser.parseFromString(item.svgText, 'image/svg+xml');
      const inner = doc.documentElement.innerHTML;
      svgContent += `<svg x="${item.x}" y="${item.y}" width="${drawW}" height="${drawH}" viewBox="0 0 ${item.origW} ${item.origH}" xmlns="${xmlns}">${inner}</svg>`;
    });
    svgContent += `</svg>`;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'canvas-export.svg';
    link.click();
    URL.revokeObjectURL(url);
  });

  canvas.addEventListener('mousedown', e => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const item = images.find(i => i.id === selectedId);
    if (item) {
      const drawW = item.origW * item.fitScale * item.scalePercent;
      const drawH = item.origH * item.fitScale * item.scalePercent;
      if (x >= item.x && x <= item.x + drawW && y >= item.y && y <= item.y + drawH) {
        dragging = true;
        dragOffset = { x: x - item.x, y: y - item.y };
      }
    }
  });
  canvas.addEventListener('mousemove', e => {
    if (dragging) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const item = images.find(i => i.id === selectedId);
      if (item) {
        item.x = x - dragOffset.x;
        item.y = y - dragOffset.y;
        redrawAll();
      }
    }
  });
  ['mouseup', 'mouseleave'].forEach(evt => canvas.addEventListener(evt, () => dragging = false));

  fileInput.addEventListener('change', e => {
    const files = Array.from(e.target.files);
    const wIn = parseFloat(widthInput.value);
    const hIn = parseFloat(heightInput.value);
    if (!(wIn > 0 && hIn > 0)) return alert('Set canvas size before adding SVGs.');
    const wPx = Math.round(wIn * DPI);
    const hPx = Math.round(hIn * DPI);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = evt => {
        const svgText = evt.target.result;
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
        const svgEl = svgDoc.documentElement;
        let origW = parseFloat(svgEl.getAttribute('width'));
        let origH = parseFloat(svgEl.getAttribute('height'));
        if (!origW || !origH) {
          const vb = svgEl.getAttribute('viewBox')?.split(' ');
          origW = parseFloat(vb[2]); origH = parseFloat(vb[3]);
        }
        const fitScale = Math.min(wPx/origW, hPx/origH);
        const id = Date.now() + '_' + Math.random();
        const blob = new Blob([svgText], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(url);
          const scalePercent = 1;
          const drawW = origW * fitScale * scalePercent;
          const drawH = origH * fitScale * scalePercent;
          const x = borderPx + (wPx - drawW)/2;
          const y = borderPx + (hPx - drawH)/2;
          images.push({ id, svgText, image: img, origW, origH, fitScale, scalePercent, x, y });
          updateList();
          selectImage(id);
          redrawAll();
        };
        img.src = url;
      };
      reader.readAsText(file);
    });
  });
});
