const DPI = 96;                   // adjust to actual cutter DPI (e.g. 300)
const MIN_CUT_INCHES = 0.001;     // your minimum cuttable feature
const MAX_SCALE = 40;             // allow up to 1000% zoom

document.addEventListener('DOMContentLoaded', () => {
const ROTATION_STEP = Math.PI / 12; // 15°
const borderPx = 4;
const lengthSelect      = document.getElementById('lengthSelect');
const widthSelect       = document.getElementById('widthSelect');
const priceDisplay      = document.getElementById('priceDisplay');
const fileInputContainer= document.getElementById('fileInputContainer');
const undoBtn           = document.getElementById('undoBtn');
const exportBtn         = document.getElementById('exportBtn');
const textBtn    = document.getElementById('textBtn');
const svgList           = document.getElementById('svgList');
const fileInput         = document.getElementById('fileInput');
const fontSelect = document.getElementById('fontSelect');
const canvas            = document.getElementById('mainCanvas');
const ctx               = canvas.getContext('2d');

const images = [], selectedId = null, history = [];
const dragging = false, cropping = false;
const dragOffset = { x: 0, y: 0 };
const cropStart  = null;

const apiKey     = 'AIzaSyAK4c5PbgmIulpkgiGH0QCmwosi0W8oNKQ'; 
const url2 = `https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}`;

fetch(url2)
    .then(res => res.json())
    .then(data => {
      // sort alphabetically:
      data.items.sort((a, b) => a.family.localeCompare(b.family));
      for (const font of data.items) {
        const opt = document.createElement('option');
        opt.value = opt.textContent = font.family;
        fontSelect.appendChild(opt);
      }
      updateList();  // rebuild all rows, now that fontSelect is populated
    })
    .catch(err => console.error('Couldn’t load Google Fonts list:', err));

//Listener Functions
function onCanvasClick(e) {
  const { x, y } = getMousePos(e);
  // search from topmost to bottom
  for (let i = images.length - 1; i >= 0; i--) {
    if (hitTest(images[i], x, y)) {
      selectImage(images[i].id);
      break;
    }
  }
}
canvas.addEventListener('click', onCanvasClick);
exportBtn.addEventListener('click', exportSVG);
      
function onUndoBtnClick() {
  if (!history.length) return;
  images = history.pop();
  selectImage(images[0]?.id);
}
undoBtn.addEventListener('click', onUndoBtnClick);
                         
lengthSelect.addEventListener('change', onLengthChange);
widthSelect.addEventListener('change', onWidthChange);

function onSvgListActionClick(e) {
  const action = e.target.dataset.action;
  if (!action || action === 'change-font' || action === 'change-size') return;

  const li = e.target.closest('li');
  if (!li) return;
  const id = li.dataset.id;
  const it = images.find(img => img.id === id);
  if (!it) return;

  switch (action) {
    case 'align-left':
      it.x = borderPx;
      break;

    case 'align-center': {
      const dW = it.origW * it.fitScale * it.scalePercent;
      it.x = (canvas.width - dW) / 2;
      break;
    }

    case 'align-right': {
      const dW = it.origW * it.fitScale * it.scalePercent;
      it.x = canvas.width - borderPx - dW;
      break;
    }

    case 'rotate-left':
      it.rotation -= ROTATION_STEP;
      break;

    case 'rotate-right':
      it.rotation += ROTATION_STEP;
      break;

    case 'duplicate':
      // make a true shallow clone with a fresh id
      const copy = {
        id:           Date.now() + '_' + Math.random(),
        filename:     it.filename,
        image:        it.image,
        svgText:      it.svgText,
        origW:        it.origW,
        origH:        it.origH,
        fitScale:     it.fitScale,
        scalePercent: it.scalePercent,
        rotation:     it.rotation,
        x:            it.x,
        y:            it.y,
        // add any other custom properties here:
        // fontFamily: it.fontFamily,
        // fontSize:   it.fontSize,
      };
      images.push(copy);
      break;

    case 'delete':
      images = images.filter(img => img.id !== id);
      if (selectedId === id) {
        selectedId = images[0]?.id || null;
      }
      break;

    case 'scale': {
      const pct = +e.target.value / 100;
      const img = images.find(i => i.id === selectedId);
      if (!img) return;
      const minS = getMinScalePercent(img);
      img.scalePercent = clamp(pct, minS, MAX_SCALE);
      pushHistory();
      redrawCanvas();
      return;  // skip the final selectImage call
    }

    default:
      return;
  }

  pushHistory();
  selectImage(selectedId || images[0]?.id);
}

  
//svgList.addEventListener('click', onSvgListActionClick);
//svgList.addEventListener('input', onSvgListActionClick);
['click','input'].forEach(ev =>
  svgList.addEventListener(ev, onSvgListActionClick)
);

function onSvgListSelectClick(e) {
  // ignore clicks on buttons, sliders, selects or number inputs
  if (e.target.closest('button, input, select')) return;
  const li = e.target.closest('li');
  if (!li) return;
  selectImage(li.dataset.id);
}
svgList.addEventListener('click', onSvgListSelectClick);

const cropBtn = document.getElementById('cropBtn');

// toggle crop‑mode on/off
function onCropBtnClick() {
    cropping = !cropping;
    // give user visual feedback:
    cropBtn.textContent = cropping ? 'Cancel Crop' : 'Crop';
    canvas.style.cursor = cropping ? 'crosshair' : 'default';
   }

  cropBtn.addEventListener('click', onCropBtnClick);
  // canvas mouse handlers (make sure these run _after_ that toggle above)
  // canvas dragging & cropping

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

// --- initial setup ---
initLength();

//functions
function getMinScalePercent(img) {
  // number of pixels that corresponds to your min cut size
  const minPx = MIN_CUT_INCHES * DPI;
  // if width * fitScale * scalePercent < minPx ⇒ too small
  // so scalePercent >= minPx / (origW * fitScale)
  return minPx / (img.origW * img.fitScale);
}

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}
  
function regenerateTextSVG(img) {
  const font = img.fontFamily || 'Arial';
  const size = img.fontSize     || 48;
  // pull the raw text string out of the old svgText:
  const match = img.svgText.match(/<text[^>]*>([^<]+)<\/text>/);
  const text  = match ? match[1] : '';
  // measure
  const ctx2 = document.createElement('canvas').getContext('2d');
  ctx2.font = `${size}px ${font}`;
  const metrics = ctx2.measureText(text);
  const left    = metrics.actualBoundingBoxLeft;
  const right   = metrics.actualBoundingBoxRight;
  const ascent  = metrics.actualBoundingBoxAscent;
  const descent = metrics.actualBoundingBoxDescent;
  
  const w = Math.ceil(left + right);
  const h = Math.ceil(ascent + descent);
  
  // One‑liner, no stray newlines/indent:
  const newSvg = 
    '<svg xmlns="http://www.w3.org/2000/svg" ' +
         'width="'  + w + '" ' +
         'height="' + h + '" ' +
         'viewBox="' + (-left) + ' 0 ' + w + ' ' + h + '">' +
         '<text x="0" y="' + ascent + '"' +
         ' font-family="' + font + '"' +
         ' font-size="'     + size     + 'px"' +  // use “size” here
         ' fill="#000">' +
        text +
      '</text>' +
    '</svg>';
  
  // reload image
  const blobOptions = { type: 'image/svg+xml' };
  const blob        = new Blob([ newSvg ], blobOptions);
  const url  = URL.createObjectURL(blob);
  const newImg = new Image();
  newImg.onload = () => {
    img.image      = newImg;
    img.svgText    = newSvg;
    img.origW      = newImg.naturalWidth;
    img.origH      = newImg.naturalHeight;
    updateList();
    selectImage(img.id);
    redrawCanvas();
    URL.revokeObjectURL(url);
  };
  newImg.src = url;
}

function getMousePos(evt) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (evt.clientX - rect.left) * (canvas.width  / rect.width),
    y: (evt.clientY - rect.top ) * (canvas.height / rect.height)
  };
}
      
// --- Core functions ---
function onImageLoaded(ev) {
  const img = ev.target;
  const m   = img._meta;

  // 1) build the new image‐record
  const newImage = {
    id:           m.id,
    filename:     m.filename,
    image:        img,
    svgText:      m.txt,
    origW:        m.origW,
    origH:        m.origH,
    fitScale:     m.fitScale,
    scalePercent: 1,
    rotation:     0,
    x:            m.x,
    y:            m.y,
  };

  // 2) replace the entire `images` array with a new one
  images = [...images, newImage];

  pushHistory();
  selectImage(m.id);
}  

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
  // Deep-clone the images array so later changes don’t overwrite our snapshot
  const snapshot = images.map(img => ({
    id:           img.id,
    filename:     img.filename,
    image:        img.image,
    svgText:      img.svgText,
    origW:        img.origW,
    origH:        img.origH,
    fitScale:     img.fitScale,
    scalePercent: img.scalePercent,
    rotation:     img.rotation,
    x:            img.x,
    y:            img.y,
    // If you’re using text properties, include them too:
    ...(img.fontFamily !== undefined && { fontFamily: img.fontFamily }),
    ...(img.fontSize   !== undefined && { fontSize:   img.fontSize   })
  }));

  history.push(snapshot);

  // Optionally, cap history length to avoid unbounded growth:
  // if (history.length > 50) history.shift();

  // Enable or disable the undo button based on available history
  undoBtn.disabled = history.length === 0;
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
      // ← new: draw a 10×10px handle at the top‑left
      ctx.fillStyle = 'blue';
      ctx.fillRect(-dW/2 - 5, -dH/2 - 5, 10, 10);
      ctx.restore();
     }
   }
}

function updateList() {
  // 1) clear out any existing list items
  svgList.innerHTML = '';

  // 2) collect all font families
  const families = [];
  for (let i = 0; i < fontSelect.options.length; i++) {
    families.push(fontSelect.options[i].value);
  }

  // 3) build a <li> for each image
  for (let idx = 0; idx < images.length; idx++) {
    const it = images[idx];

    // list item container
    const li = document.createElement('li');
    li.dataset.id = it.id;
    if (it.id === selectedId) {
      li.classList.add('selected');
    }

    // filename label
    const name = document.createElement('span');
    name.className = 'filename';
    name.textContent = it.filename;

    // controls container
    const ctr = document.createElement('div');
    ctr.className = 'item-controls';

    // align buttons
    const alignLeft = document.createElement('button');
    alignLeft.textContent    = '←';
    alignLeft.title          = 'Align Left';
    alignLeft.dataset.action = 'align-left';

    const alignCenter = document.createElement('button');
    alignCenter.textContent    = '↔';
    alignCenter.title          = 'Align Center';
    alignCenter.dataset.action = 'align-center';

    const alignRight = document.createElement('button');
    alignRight.textContent    = '→';
    alignRight.title          = 'Align Right';
    alignRight.dataset.action = 'align-right';

    ctr.append(alignLeft, alignCenter, alignRight);

    // rotation buttons
    const rotateLeft = document.createElement('button');
    rotateLeft.textContent    = '⟲';
    rotateLeft.title          = 'Rotate Left 15°';
    rotateLeft.dataset.action = 'rotate-left';

    const rotateRight = document.createElement('button');
    rotateRight.textContent    = '⟳';
    rotateRight.title          = 'Rotate Right 15°';
    rotateRight.dataset.action = 'rotate-right';

    // scale slider
    const scaleIn = document.createElement('input');
    scaleIn.type           = 'range';
    scaleIn.min            = '50';
    scaleIn.max            = '200';
    scaleIn.value          = (it.scalePercent * 100).toFixed(0);
    scaleIn.title          = 'Scale %';
    scaleIn.dataset.action = 'scale';

    // duplicate & delete
    const dup = document.createElement('button');
    dup.textContent    = '⎘';
    dup.title          = 'Duplicate';
    dup.dataset.action = 'duplicate';

    const del = document.createElement('button');
    del.textContent    = '✕';
    del.title          = 'Delete';
    del.dataset.action = 'delete';

    ctr.append(rotateLeft, rotateRight, scaleIn, dup, del);

    // assemble and append
    li.append(name, ctr);
    svgList.append(li);

    // --- if it's a text SVG, add font & size controls ---
    if (it.svgText.indexOf('<text') !== -1) {
      // font dropdown
      const fontSel = document.createElement('select');
      fontSel.dataset.action = 'change-font';

      for (let j = 0; j < families.length; j++) {
        const opt = document.createElement('option');
        opt.value        = families[j];
        opt.textContent  = families[j];
        if (it.fontFamily === families[j]) {
          opt.selected = true;
        }
        fontSel.appendChild(opt);
      }

      // hook up named handlers (defined elsewhere)
      fontSel.addEventListener('change', handleFontChange);
      fontSel.addEventListener('keydown', handleFontKeydown);

      ctr.appendChild(fontSel);

      // size input
      const sizeIn = document.createElement('input');
      sizeIn.type     = 'number';
      sizeIn.min      = 8;
      sizeIn.max      = 200;
      sizeIn.value    = it.fontSize || 48;
      sizeIn.style.width = '4rem';
      sizeIn.addEventListener('change', handleFontSizeChange);

      ctr.appendChild(sizeIn);
    }
  }
}

function rotateSelected(by = ROTATION_STEP) {
  const img = images.find(i => i.id === selectedId);
  if (!img) return;
  img.rotation += by;
  pushHistory();
  redrawCanvas();
}
      
function selectImage(id) {
  selectedId = id;
  updateList();
  redrawCanvas();
}

function exportSVG() {
 const L = +lengthSelect.value, W = +widthSelect.value;
  if (!(L && W)) return;
  const wPx   = L * DPI, hPx = W * DPI;
  const xmlns = 'http://www.w3.org/2000/svg';

  let out = `<svg xmlns="${xmlns}" width="${wPx+2*borderPx}" height="${hPx+2*borderPx}" viewBox="0 0 ${wPx+2*borderPx} ${hPx+2*borderPx}">`
          + `<rect x="${borderPx/2}" y="${borderPx/2}" width="${wPx+borderPx}" height="${hPx+borderPx}" fill="none" stroke="black" stroke-width="${borderPx}"/>`;
  out += `
    <text x="${borderPx+4}"
          y="${hPx+2*borderPx-4}"
          font-family="Arial, sans-serif"
          font-size="16"
          fill="#000"
          text-anchor="start">
      L: ${L}&quot;
    </text>
    <text x="${wPx+borderPx-4}"
          y="${hPx+2*borderPx-4}"
          font-family="Arial, sans-serif"
          font-size="16"
          fill="#000"
          text-anchor="end">
      W: ${W}&quot;
    </text>`;

  for (const it of images) {
    // final display size
    const dW = it.origW * it.fitScale * it.scalePercent;
    const dH = it.origH * it.fitScale * it.scalePercent;

     out += `<svg x="${it.x}"
     y="${it.y}"
     width="${dW}"
     height="${dH}"
     viewBox="0 0 ${it.origW} ${it.origH}"
     xmlns="${xmlns}">
     ${new DOMParser()
    .parseFromString(it.svgText,'image/svg+xml')
    .documentElement.innerHTML}
    </svg>`;
    
    out += `</svg>`;
      
    // center about which we rotate
    const cx  = it.x + dW/2;
    const cy  = it.y + dH/2;

    // convert radians → degrees
    const angle = (it.rotation * 180 / Math.PI).toFixed(2);

    // grab the inner SVG payload
    const inner = new DOMParser()
      .parseFromString(it.svgText, 'image/svg+xml')
      .documentElement.innerHTML;

    // wrap in a <g> that:
    //  1) translates to the canvas position of its center
    //  2) rotates by the saved angle
    //  3) translates back by half its width/height
    out += `
      <g transform="
        translate(${cx},${cy})
        rotate(${angle})
        translate(${-dW/2},${-dH/2})
      ">
        <svg
          width="${dW}"
          height="${dH}"
          viewBox="0 0 ${it.origW} ${it.origH}"
          xmlns="${xmlns}">
          ${inner}
        </svg>
      </g>
    `;
  out += `</svg>`;

  const mime = { type: 'image/svg+xml' };
  const blob = new Blob([out], mime);
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'canvas-export.svg'; a.click();
  URL.revokeObjectURL(url);
}

// --- canvas dragging & cropping helpers ---
function hitTest(img, x, y) {
  // full drawn size
  const dW = img.origW * img.fitScale * img.scalePercent;
  const dH = img.origH * img.fitScale * img.scalePercent;
  // center of the image on canvas
  const cx = img.x + dW/2;
  const cy = img.y + dH/2;

  // vector from center to click
  const dx = x - cx;
  const dy = y - cy;

  // rotate that vector by –rotation
  const cos = Math.cos(-img.rotation);
  const sin = Math.sin(-img.rotation);
  const lx  = dx * cos - dy * sin;
  const ly  = dx * sin + dy * cos;

  // now see if it lies within the axis‑aligned box
  return lx >= -dW/2 && lx <= dW/2
      && ly >= -dH/2 && ly <= dH/2;
}
  
function onMouseDown(e) {
  const { x, y } = getMousePos(e);
    
  if (cropping) {
    cropStart = { startX: x, startY: y, curX: x, curY: y };
  } else {
    for (let i = images.length - 1; i >= 0; i--) {
    const img = images[i];
     if (hitTest(img, x, y)) {
      if (img.id !== selectedId) {
        selectImage(img.id);
      }
      // now start dragging
      dragging = true;
      dragOffset.x = x - img.x;
      dragOffset.y = y - img.y;
      pushHistory();
      return;
     }
    }
    const it = images.find(img => hitTest(img, x, y));
    if (it) {
      selectedId = it.id;
         // start dragging immediately:
      dragging = true;
      dragOffset.x = x - it.x;
      dragOffset.y = y - it.y;
        // if you click *any* image (not just the already‑selected), select & begin drag
    }
  }
   redrawCanvas();
}    
      
function onMouseMove(e) {
  const { x, y } = getMousePos(e);
  if (cropping && cropStart) {
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
  if (dragging) {
    updateList();
    redrawCanvas();
  }
  dragging = false;
  if (cropping && cropStart) {
    finalizeCrop();
    cropStart = null;
  }
}
canvas.addEventListener('mousedown', onMouseDown);
canvas.addEventListener('mousemove', onMouseMove);
['mouseup','mouseleave'].forEach(evt =>
   canvas.addEventListener(evt, onMouseUp)
);
    
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
  // inside finalizeCrop, after computing x0,y0,w0,h0:
  const sx = it.x + x0;
  const sy = it.y + y0;
  // draw from the main canvas bitmap:
 // draw only the raw img, not the overlays:
  tctx.save();
  tctx.translate(-it.x, -it.y);
  tctx.drawImage(it.image, it.x, it.y, it.origW * it.fitScale * it.scalePercent,
               it.origH * it.fitScale * it.scalePercent);
  tctx.restore();

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
  if (L && W) {
    const wPx = L * DPI, hPx = W * DPI;
    
// Loop 
    for (const file of e.target.files) {
      readSvgFile(file, wPx, hPx);
    }
    redrawCanvas();
  }
}
fileInput.addEventListener('change', handleFileLoad);

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

function generateText() {
  const text = prompt('Enter text to turn into SVG:');
  if (!text) return;

  const fontInput     = fontSelect.value;
  const fontSizeInput = document.getElementById('fontSizeInput');
  const fontSize      = parseInt(fontSizeInput.value, 10) || 48;

  // This does all the SVG‐building, blob creation, and image‐load hookup:
  function buildSVG() {
    // measure text
    const measureCtx = document.createElement('canvas').getContext('2d');
    measureCtx.font = fontSize + 'px ' + fontInput;
    const metrics = measureCtx.measureText(text);
    const left    = metrics.actualBoundingBoxLeft;
    const right   = metrics.actualBoundingBoxRight;
    const ascent  = metrics.actualBoundingBoxAscent;
    const descent = metrics.actualBoundingBoxDescent;
    const w = Math.ceil(left + right);
    const h = Math.ceil(ascent + descent);

    // assemble SVG string
    const svgString =
      '<svg xmlns="http://www.w3.org/2000/svg" ' +
        'width="'  + w + '" ' +
        'height="' + h + '" ' +
        'viewBox="' + (-left) + ' 0 ' + w + ' ' + h + '">' +
        '<style>text{' +
          'font-family:"' + fontInput + '";' +
          'font-size:'   + fontSize   + 'px;' +
          'fill:#000;' +
        '}</style>' +
        '<text x="0" y="' + ascent + '">' +
          text +
        '</text>' +
      '</svg>';

    // blob + URL
    const blobOpts = { type: 'image/svg+xml' };
    const blob     = new Blob([ svgString ], blobOpts);
    const url      = URL.createObjectURL(blob);

    // image loader
    const img = new Image();
    img.addEventListener('load', handleSvgImageLoad);
    img.src = url;

   function handleSvgImageLoad(ev) {
      const loadedImg = ev.target;
    
      // build the new image record in its own variable
      const newImage = {
        id:           Date.now().toString(36),
        filename:     text.replace(/\s+/g,'_') + '_' + fontInput + '_' + fontSize + 'px.svg',
        svgText:      svgString,
        origW:        w,
        origH:        h,
        fitScale:     1,
        scalePercent: 1,
        rotation:     0,
        fontFamily:   fontInput,
        fontSize:     fontSize,
        x:            borderPx + (canvas.width/2 - w/2),
        y:            borderPx + (canvas.height/2 - h/2),
        image:        loadedImg
      };
    
      // now push it
      images.push(newImage);
    
      updateList();
      redrawCanvas();
      URL.revokeObjectURL(url);
    }
  }

  // pull out the WebFont config so we don’t inline an object into the call
  const wfConfig = {
    google:   { families: [ fontInput ] },
    active:    buildSVG,
    inactive:  buildSVG
  };

  WebFont.load(wfConfig);
}
textBtn.addEventListener('click', generateText);
}); 
