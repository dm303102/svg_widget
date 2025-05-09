document.addEventListener('DOMContentLoaded', () => {
// --- configuration & DOM refs ---
const variants = [
      { length: 4, width: 4, price: 12.00 },
      { length: 4, width: 6, price: 14.00 },
      { length: 4, width: 8, price: 16.00 },
      { length: 4, width: 10, price: 18.00 },
      { length: 4, width: 12, price: 20.00 },
      { length: 6, width: 4, price: 14.00 },
      { length: 6, width: 6, price: 15.00 },
      { length: 6, width: 8, price: 17.00 },
      { length: 6, width: 10, price: 19.00 },
      { length: 6, width: 12, price: 21.00 },
      { length: 8, width: 4, price: 16.00 },
      { length: 8, width: 6, price: 17.00 },
      { length: 8, width: 8, price: 19.00 },
      { length: 8, width: 10, price: 21.00 },
      { length: 8, width: 12, price: 23.00 },
      { length: 10, width: 4, price: 18.00 },
      { length: 10, width: 6, price: 19.00 },
      { length: 10, width: 8, price: 21.00 },
      { length: 10, width: 10, price: 22.00 },
      { length: 10, width: 12, price: 24.00 },
      { length: 12, width: 4, price: 20.00 },
      { length: 12, width: 6, price: 21.00 },
      { length: 12, width: 8, price: 23.00 },
      { length: 12, width: 10, price: 24.00 },
      { length: 12, width: 12, price: 28.00 },
      { length: 14, width: 4, price: 22.00 },
      { length: 14, width: 6, price: 24.00 },
      { length: 14, width: 8, price: 26.00 },
      { length: 14, width: 10, price: 28.00 },
      { length: 14, width: 12, price: 30.00 },
      { length: 16, width: 4, price: 24.00 },
      { length: 16, width: 6, price: 25.00 },
      { length: 16, width: 8, price: 27.00 },
      { length: 16, width: 10, price: 29.00 },
      { length: 16, width: 12, price: 31.00 },
      { length: 18, width: 4, price: 26.00 },
      { length: 18, width: 6, price: 28.00 },
      { length: 18, width: 8, price: 30.00 },
      { length: 18, width: 10, price: 32.00 },
      { length: 18, width: 12, price: 34.00 },
      { length: 20, width: 4, price: 28.00 },
      { length: 20, width: 6, price: 30.00 },
      { length: 20, width: 8, price: 32.00 },
      { length: 20, width: 10, price: 34.00 },
      { length: 20, width: 12, price: 36.00 },
      { length: 22, width: 4, price: 30.00 },
      { length: 22, width: 6, price: 32.00 },
      { length: 22, width: 8, price: 34.00 },
      { length: 22, width: 10, price: 36.00 },
      { length: 22, width: 12, price: 38.00 },
      { length: 24, width: 4, price: 30.00 },
      { length: 24, width: 6, price: 32.00 },
      { length: 24, width: 8, price: 34.00 },
      { length: 24, width: 10, price: 36.00 },
      { length: 24, width: 12, price: 38.00 },
      { length: 26, width: 4, price: 32.00 },
      { length: 26, width: 6, price: 34.00 },
      { length: 26, width: 8, price: 36.00 },
      { length: 26, width: 10, price: 38.00 },
      { length: 26, width: 12, price: 40.00 },
      { length: 28, width: 4, price: 34.00 },
      { length: 28, width: 6, price: 36.00 },
      { length: 28, width: 8, price: 38.00 },
      { length: 28, width: 10, price: 40.00 },
      { length: 28, width: 12, price: 42.00 },
      { length: 30, width: 4, price: 36.00 },
      { length: 30, width: 6, price: 38.00 },
      { length: 30, width: 8, price: 40.00 },
      { length: 30, width: 10, price: 42.00 },
      { length: 30, width: 12, price: 44.00 },
      { length: 32, width: 4, price: 38.00 },
      { length: 32, width: 6, price: 40.00 },
      { length: 32, width: 8, price: 42.00 },
      { length: 32, width: 10, price: 44.00 },
      { length: 32, width: 12, price: 46.00 },
      { length: 34, width: 4, price: 40.00 },
      { length: 34, width: 6, price: 42.00 },
      { length: 34, width: 8, price: 44.00 },
      { length: 34, width: 10, price: 46.00 },
      { length: 34, width: 12, price: 48.00 },
      { length: 36, width: 4, price: 42.00 },
      { length: 36, width: 6, price: 44.00 },
      { length: 36, width: 8, price: 46.00 },
      { length: 36, width: 10, price: 48.00 },
      { length: 36, width: 12, price: 50.00 }
];

const DPI = 96, borderPx = 4;
const lengthSelect      = document.getElementById('lengthSelect');
const widthSelect       = document.getElementById('widthSelect');
const priceDisplay      = document.getElementById('priceDisplay');
const fileInputContainer= document.getElementById('fileInputContainer');
const renderBtn         = document.getElementById('renderBtn');
const undoBtn           = document.getElementById('undoBtn');
const exportBtn         = document.getElementById('exportBtn');
const svgList           = document.getElementById('svgList');
const fileInput         = document.getElementById('fileInput');
const canvas            = document.getElementById('mainCanvas');
const ctx               = canvas.getContext('2d');

let images = [], selectedId = null, history = [];
let dragging = false, cropping = false;
let dragOffset = { x: 0, y: 0 };
let cropStart  = { startX: 0, startY: 0, curX: 0, curY: 0 };

// --- initial setup ---
initLength();
renderBtn.addEventListener('click', redrawCanvas);
exportBtn.addEventListener('click', exportSVG);
      
function onUndoBtnClick() {
  if (!history.length) return;
  images = history.pop();
  selectImage(images[0]?.id);
}
undoBtn.addEventListener('click', onUndoBtnClick);
                         
lengthSelect.addEventListener('change', onLengthChange);
widthSelect.addEventListener('change', onWidthChange);
fileInput.addEventListener('change', handleFileLoad);
      
function onSvgListActionClick(e) {
  const action = e.target.dataset.action;
  const li     = e.target.closest('li');
  const it     = images.find(img => img.id === li.dataset.id);

  if (!li) return;
  const id = li.dataset.id;
  if (action === 'scale') {
    const pct = +e.target.value / 100;
    it.scalePercent = pct;
  }  
  
  switch (action) {
    case 'rotate':
      it.rotation += Math.PI/2;
      break;
    case 'duplicate':
      const copy = { ...it, id: Date.now() + '_' + Math.random() };
      images.push(copy);
      break;
    case 'delete':
      images = images.filter(img => img.id !== id);
      if (selectedId === id) selectedId = images[0]?.id || null;
      break;
  }
  pushHistory();
  selectImage(selectedId || images[0]?.id);
}
svgList.addEventListener('click', onSvgListActionClick);

function onSvgListSelectClick(e) {
  const btn = e.target.closest('button, input[type=range]');
  if (btn) return;    // handled above
  const li = e.target.closest('li');
  if (!li) return;
  selectImage(li.dataset.id);
}
svgList.addEventListener('click', onSvgListSelectClick);

// canvas dragging & cropping
canvas.addEventListener('mousedown', onMouseDown);
canvas.addEventListener('mousemove', onMouseMove);
['mouseup','mouseleave'].forEach(evt =>
  canvas.addEventListener(evt, onMouseUp)
);

// --- functions ---

function initLength() {
  const lengths = Array.from(new Set(variants.map(v => v.length))).sort((a,b)=>a-b);
  lengthSelect.innerHTML = '<option value="">–</option>';
  lengths.forEach(l => lengthSelect.add(new Option(`${l}"`, l)));
  lengthSelect.disabled = false;
}

function onLengthChange() {
  const L = +lengthSelect.value;
  widthSelect.innerHTML = '<option value="">–</option>';
  widthSelect.disabled = !L;
  if (L) {
    variants
      .filter(v => v.length === L)
      .map(v => v.width)
      .sort((a,b)=>a-b)
      .forEach(w => widthSelect.add(new Option(`${w}"`, w)));
  }
  priceDisplay.textContent = '';
  fileInputContainer.style.display = 'none';
  redrawCanvas();
}

function onWidthChange() {
  const L = +lengthSelect.value, W = +widthSelect.value;
  const v = variants.find(x => x.length===L && x.width===W);
  priceDisplay.textContent = v ? `Price: $${v.price.toFixed(2)}` : '';
  fileInputContainer.style.display = v ? 'block' : 'none';
  redrawCanvas();
}

function pushHistory() {
  history.push(images.map(item => ({ ...item })));
  if (history.length > 50) history.shift();
}

function redrawCanvas() {
  const L = +lengthSelect.value, W = +widthSelect.value;
  if (L && W) {
    const wPx = L * DPI, hPx = W * DPI;
    canvas.width  = wPx + 2*borderPx;
    canvas.height = hPx + 2*borderPx;
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.lineWidth = borderPx; ctx.strokeStyle = '#000';
    ctx.strokeRect(borderPx/2, borderPx/2, wPx+borderPx, hPx+borderPx);
    ctx.fillStyle = '#000'; ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';  ctx.fillText(`L: ${L}"`,             borderPx+4, canvas.height-4);
    ctx.textAlign = 'right'; ctx.fillText(`W: ${W}"`, canvas.width-borderPx-4, canvas.height-4);
  }

  for (const it of images) {
    const dW = it.origW * it.fitScale * it.scalePercent;
    const dH = it.origH * it.fitScale * it.scalePercent;
    const cx = it.x + dW/2, cy = it.y + dH/2;
    ctx.save(); ctx.translate(cx,cy); ctx.rotate(it.rotation);
    ctx.drawImage(it.image, -dW/2, -dH/2, dW, dH);
    ctx.restore();
    if (it.id === selectedId) {
      ctx.save(); ctx.translate(cx,cy); ctx.rotate(it.rotation);
      ctx.strokeStyle='red'; ctx.lineWidth=2;
      ctx.strokeRect(-dW/2, -dH/2, dW, dH);
      ctx.restore();
    }
  }
}

function updateList() {
  svgList.innerHTML = '';
  for (const it of images) {
    const li = document.createElement('li');
    li.dataset.id = it.id;
    if (it.id===selectedId) li.classList.add('selected');
    const name = document.createElement('span');
    name.className = 'filename';
    name.textContent = it.filename;

    // --- controls container ---
    const ctr = document.createElement('div');
    ctr.className = 'item-controls';

    // rotate button
    const rotateBtn = document.createElement('button');
    rotateBtn.textContent = '⟳';
    rotateBtn.title = 'Rotate 90°';
    rotateBtn.dataset.action = 'rotate';

    // scale slider
    const scaleInput = document.createElement('input');
    scaleInput.type = 'range';
    scaleInput.min = '50';
    scaleInput.max = '200';
    scaleInput.value = (it.scalePercent * 100).toFixed(0);
    scaleInput.title = 'Scale %';
    scaleInput.dataset.action = 'scale';

    // duplicate button
    const dupBtn = document.createElement('button');
    dupBtn.textContent = '⎘';
    dupBtn.title = 'Duplicate';
    dupBtn.dataset.action = 'duplicate';

    // delete button
    const delBtn = document.createElement('button');
    delBtn.textContent = '✕';
    delBtn.title = 'Delete';
    delBtn.dataset.action = 'delete';

    ctr.append(rotateBtn, scaleInput, dupBtn, delBtn);
    li.append(name, ctr);
    svgList.append(li);
  }
}

function selectImage(id) {
  selectedId = id;
  updateList();
  redrawCanvas();
}

function exportSVG() {
  const L = +lengthSelect.value, W = +widthSelect.value;
  if (!(L && W)) return;
  const wPx = L*DPI, hPx = W*DPI;
  const xmlns = 'http://www.w3.org/2000/svg';
  let out = `<svg xmlns="${xmlns}" width="${wPx+2*borderPx}" height="${hPx+2*borderPx}" viewBox="0 0 ${wPx+2*borderPx} ${hPx+2*borderPx}">`
          + `<rect x="${borderPx/2}" y="${borderPx/2}" width="${wPx+borderPx}" height="${hPx+borderPx}" fill="none" stroke="black" stroke-width="${borderPx}"/>`;
  for (const it of images) {
    const dW = it.origW*it.fitScale*it.scalePercent;
    const dH = it.origH*it.fitScale*it.scalePercent;
    out += `<svg x="${it.x}" y="${it.y}" width="${dW}" height="${dH}" viewBox="0 0 ${it.origW} ${it.origH}" xmlns="${xmlns}">`
        + new DOMParser().parseFromString(it.svgText,'image/svg+xml').documentElement.innerHTML
        + `</svg>`;
  }
  out += `</svg>`;
  const mime = { type: 'image/svg+xml' };
  const blob = new Blob([out], mime);
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'canvas-export.svg'; a.click();
  URL.revokeObjectURL(url);
}

// --- canvas dragging & cropping helpers ---
function toCanvasCoords(e) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}
function hitTest(img, x, y) {
  const w = img.origW * img.fitScale * img.scalePercent;
  const h = img.origH * img.fitScale * img.scalePercent;
  return x >= img.x && x <= img.x + w && y >= img.y && y <= img.y + h;
}
function onMouseDown(e) {
  const { x, y } = toCanvasCoords(e);
  if (cropping) {
    cropStart.startX = cropStart.curX = x;
    cropStart.startY = cropStart.curY = y;
    return;
  }
  const sel = images.find(img => img.id === selectedId);
  if (sel && hitTest(sel, x, y)) {
    dragging = true;
    dragOffset.x = x - sel.x;
    dragOffset.y = y - sel.y;
    pushHistory();
  }
}
function onMouseMove(e) {
  const { x, y } = toCanvasCoords(e);
  if (cropping && cropStart.startX != null) {
    cropStart.curX = x;
    cropStart.curY = y;
    redrawCanvas();
    drawCropOverlay();
    return;
  }
  if (dragging) {
    const sel = images.find(img => img.id === selectedId);
    sel.x = x - dragOffset.x;
    sel.y = y - dragOffset.y;
    redrawCanvas();
  }
}
function onMouseUp() {
  if (cropping && cropStart.startX != null) finalizeCrop();
  if (dragging) {
    updateList();
    redrawCanvas();
  }
  dragging = cropping = false;
}
function drawCropOverlay() {
  const { startX, startY, curX, curY } = cropStart;
  const x0 = Math.min(startX,curX), y0 = Math.min(startY,curY);
  const w0 = Math.abs(curX-startX), h0 = Math.abs(curY-startY);
  ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(x0,y0,w0,h0);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.strokeRect(x0,y0,w0,h0);
  ctx.restore();
}
function finalizeCrop() {
  const it = images.find(img => img.id === selectedId);
  const { startX, startY, curX, curY } = cropStart;
  const x0 = Math.min(startX,curX) - it.x;
  const y0 = Math.min(startY,curY) - it.y;
  const w0 = Math.abs(curX-startX), h0 = Math.abs(curY-startY);
  pushHistory();
      
  // draw the selected region into a temp canvas
  const tmp = document.createElement('canvas');
  tmp.width = w0; tmp.height = h0;
  const tctx = tmp.getContext('2d');
  tctx.drawImage(it.image, x0,y0,w0,h0, 0,0,w0,h0);

  // replace image with the cropped one    
  const newImg = new Image();
  newImg.onload = () => {
    it.image = newImg;
    it.origW = w0; it.origH = h0;
    it.fitScale = 1; it.scalePercent = 1;

      // --- NEW: update svgText for export ---
      // we serialize the original SVG with a new viewBox to reflect the crop
      const parser = new DOMParser();
      const doc   = parser.parseFromString(it.svgText, 'image/svg+xml');
      const svgEl = doc.documentElement;
      svgEl.setAttribute('viewBox', `${x0} ${y0} ${w0} ${h0}`);
      svgEl.setAttribute('width', w0);
      svgEl.setAttribute('height', h0);
      it.svgText = new XMLSerializer().serializeToString(svgEl);      

    // re-center in canvas
    it.x = borderPx + (canvas.width/2 - w0/2);
    it.y = borderPx + (canvas.height/2 - h0/2);
    updateList();
    redrawCanvas();
  };
  newImg.src = tmp.toDataURL();
}

function handleFileLoad(e) {
  const L = +lengthSelect.value, W = +widthSelect.value;
  if (!(L && W)) return;
  const wPx = L * DPI, hPx = W * DPI;

  // Loop normally, no .forEach → no "});"
  for (const file of e.target.files) {
    readSvgFile(file, wPx, hPx);
  }
}

function readSvgFile(file, wPx, hPx) {
  const reader = new FileReader();
  // named callback instead of reader.onload = ev => { … };
  reader.addEventListener('load', onSvgTextLoaded);
  reader.readAsText(file);

  // closure data via properties on the reader (or capture via a WeakMap)
  reader._file = file;
  reader._wPx  = wPx;
  reader._hPx  = hPx;
}

function onSvgTextLoaded(ev) {
  const reader = ev.target;
  const file   = reader._file;
  const wPx    = reader._wPx;
  const hPx    = reader._hPx;
  const txt    = ev.target.result;

  const doc  = new DOMParser().parseFromString(txt, 'image/svg+xml');
  const svgEl = doc.documentElement;
  const origW = parseFloat(svgEl.getAttribute('width'))  || parseFloat(svgEl.getAttribute('viewBox').split(' ')[2]);
  const origH = parseFloat(svgEl.getAttribute('height')) || parseFloat(svgEl.getAttribute('viewBox').split(' ')[3]);
  const fitScale = Math.min(wPx/origW, hPx/origH);
  const dW       = origW * fitScale, dH = origH * fitScale;
  const x        = borderPx + (wPx - dW)/2;
  const y        = borderPx + (hPx - dH)/2;
  const id       = Date.now() + '_' + Math.random();

  const img = new Image();
  // again, named instead of inline arrow:
  img.addEventListener('load', onImageLoaded);
  img.src = URL.createObjectURL(new Blob([txt], { type: 'image/svg+xml' }));

  // stash the rest on the image so we can read them in the callback
  img._meta = { id, filename: file.name, txt, origW, origH, fitScale, x, y };
}

function onImageLoaded(ev) {
  const img    = ev.target;
  const m      = img._meta;
  images.push({
    id:          m.id,
    filename:    m.filename,
    image:       img,
    svgText:     m.txt,
    origW:       m.origW,
    origH:       m.origH,
    fitScale:    m.fitScale,
    scalePercent: 1,
    rotation:    0,
    x:           m.x,
    y:           m.y
  });
  pushHistory();
  selectImage(m.id);
}
});
