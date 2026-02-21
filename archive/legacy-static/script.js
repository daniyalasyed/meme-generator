(function () {
  const CANVAS_MAX = 600;
  const DEFAULT_FONT_SIZE = 48;
  const FONT_MIN = 16;
  const FONT_MAX = 120;
  const STROKE_RATIO = 12;
  const HIT_PADDING = 8;

  const canvas = document.getElementById('memeCanvas');
  const ctx = canvas.getContext('2d');
  const imageInput = document.getElementById('imageInput');
  const templateThumbs = document.getElementById('templateThumbs');
  const addBlockBtn = document.getElementById('addBlockBtn');
  const blocksList = document.getElementById('blocksList');
  const downloadBtn = document.getElementById('downloadBtn');
  const noImageHint = document.getElementById('noImageHint');
  const textAdderBar = document.getElementById('textAdderBar');
  const textBlocksPane = document.getElementById('textBlocksPane');

  const TEMPLATES = [
    { path: 'assets/Drake Hotline Bling Meme - Blank Template.jpg', name: 'Drake Hotline Bling' },
    { path: 'assets/I-Bet-Hes-Thinking-About-Other-Women Meme - Blank Template.jpg', name: 'I Bet He\'s Thinking About Other Women' },
    { path: 'assets/Two Buttons Meme - Blank Template.jpg', name: 'Two Buttons' }
  ];

  let backgroundImage = null;
  let canvasWidth = CANVAS_MAX;
  let canvasHeight = CANVAS_MAX;
  let blocks = [];
  let nextId = 1;
  let draggingBlock = null;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  function updateUiState() {
    const hasImage = Boolean(backgroundImage);
    const hasBlocks = blocks.length > 0;
    noImageHint.classList.toggle('hidden', hasImage);
    textAdderBar.hidden = !hasImage;
    textBlocksPane.hidden = !hasBlocks;
    downloadBtn.hidden = !hasImage;
    downloadBtn.disabled = !hasImage;
  }

  function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  function createBlock(opt) {
    const block = {
      id: nextId++,
      text: opt?.text ?? '',
      x: opt?.x ?? canvasWidth / 2,
      y: opt?.y ?? canvasHeight / 2,
      fontSize: Math.min(FONT_MAX, Math.max(FONT_MIN, opt?.fontSize ?? DEFAULT_FONT_SIZE)),
      textColor: opt?.textColor ?? '#ffffff'
    };
    return block;
  }

  const LINE_HEIGHT_RATIO = 1.15;
  const MAX_TEXT_WIDTH_PAD = 40;

  function wrapBlockText(block) {
    const font = `bold ${block.fontSize}px "Impact", "Arial Black", sans-serif`;
    ctx.save();
    ctx.font = font;
    const maxW = Math.max(80, canvasWidth - MAX_TEXT_WIDTH_PAD);
    const raw = (block.text || '').trim() || ' ';
    const segments = raw.split(/\n/);
    const lines = [];
    function wrapOne(segment) {
      const words = segment.split(/\s+/).filter(Boolean);
      let line = '';
      for (let i = 0; i < words.length; i++) {
        const trial = line ? line + ' ' + words[i] : words[i];
        if (ctx.measureText(trial).width <= maxW) {
          line = trial;
        } else {
          if (line) lines.push(line);
          line = words[i];
        }
      }
      lines.push(line || ' ');
    }
    segments.forEach(wrapOne);
    if (lines.length === 0) lines.push(' ');
    ctx.restore();
    return lines;
  }

  function getBlockBounds(block) {
    const lines = wrapBlockText(block);
    ctx.save();
    ctx.font = `bold ${block.fontSize}px "Impact", "Arial Black", sans-serif`;
    let w = 0;
    lines.forEach(function (line) {
      w = Math.max(w, ctx.measureText(line).width);
    });
    ctx.restore();
    const lineHeight = block.fontSize * LINE_HEIGHT_RATIO;
    const h = lines.length * lineHeight;
    const pad = HIT_PADDING + (block.fontSize / STROKE_RATIO) / 2;
    return {
      left: block.x - w / 2 - pad,
      right: block.x + w / 2 + pad,
      top: block.y - h / 2 - pad,
      bottom: block.y + h / 2 + pad
    };
  }

  function hitTest(x, y) {
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = getBlockBounds(blocks[i]);
      if (x >= b.left && x <= b.right && y >= b.top && y <= b.bottom) {
        return blocks[i];
      }
    }
    return null;
  }

  function drawBlock(block, selected, showSelection) {
    const lines = wrapBlockText(block);
    const font = `bold ${block.fontSize}px "Impact", "Arial Black", sans-serif`;
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lineHeight = block.fontSize * LINE_HEIGHT_RATIO;
    const totalH = lines.length * lineHeight;
    let y = block.y - totalH / 2 + lineHeight / 2;
    const lineWidth = Math.max(2, block.fontSize / STROKE_RATIO);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = lineWidth;
    ctx.fillStyle = block.textColor || '#ffffff';
    lines.forEach(function (line) {
      ctx.strokeText(line, block.x, y);
      ctx.fillText(line, block.x, y);
      y += lineHeight;
    });
    if (selected && showSelection) {
      const b = getBlockBounds(block);
      ctx.strokeStyle = 'rgba(232, 93, 76, 0.9)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(b.left, b.top, b.right - b.left, b.bottom - b.top);
      ctx.setLineDash([]);
    }
  }

  function draw(showSelection = true) {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (backgroundImage) {
      ctx.drawImage(backgroundImage, 0, 0, canvasWidth, canvasHeight);
    }
    if (!backgroundImage) return;
    const selectedId = document.querySelector('.block-row.selected')?.dataset?.blockId;
    const selected = selectedId ? blocks.find(b => String(b.id) === selectedId) : null;
    blocks.forEach(function (block) {
      drawBlock(block, block === selected, showSelection);
    });
  }

  function setCanvasSize(w, h) {
    canvasWidth = w;
    canvasHeight = h;
    canvas.width = w;
    canvas.height = h;
    draw();
  }

  function loadImage(src) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    let urlToRevoke = null;
    img.onload = function () {
      if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
      const prevWidth = canvasWidth;
      const prevHeight = canvasHeight;
      backgroundImage = img;
      let w = img.width;
      let h = img.height;
      if (w > CANVAS_MAX || h > CANVAS_MAX) {
        const scale = Math.min(CANVAS_MAX / w, CANVAS_MAX / h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      if (blocks.length > 0 && prevWidth > 0 && prevHeight > 0) {
        const scaleX = w / prevWidth;
        const scaleY = h / prevHeight;
        blocks.forEach(function (block) {
          block.x = Math.round(block.x * scaleX);
          block.y = Math.round(block.y * scaleY);
        });
      }
      setCanvasSize(w, h);
      updateUiState();
    };
    img.onerror = function () {
      console.error('Failed to load image');
    };
    if (typeof src === 'string') {
      img.src = src;
    } else if (src && src instanceof File) {
      urlToRevoke = URL.createObjectURL(src);
      img.src = urlToRevoke;
    }
  }

  function addBlock() {
    if (!backgroundImage) return;
    const block = createBlock({
      x: canvasWidth / 2,
      y: canvasHeight / 2,
      fontSize: DEFAULT_FONT_SIZE
    });
    blocks.push(block);
    renderBlockRow(block);
    blocksList.querySelectorAll('.block-row').forEach(r => r.classList.remove('selected'));
    const createdRow = document.querySelector(`.block-row[data-block-id="${block.id}"]`);
    if (createdRow) createdRow.classList.add('selected');
    updateUiState();
    draw();
  }

  function removeBlock(id) {
    blocks = blocks.filter(b => b.id !== id);
    const row = document.querySelector(`.block-row[data-block-id="${id}"]`);
    if (row) row.remove();
    if (draggingBlock && draggingBlock.id === id) {
      draggingBlock = null;
    }
    updateUiState();
    draw();
  }

  function renderBlockRow(block) {
    const row = document.createElement('div');
    row.className = 'block-row';
    row.dataset.blockId = block.id;
    row.innerHTML = `
      <label>Text</label>
      <textarea class="block-text" rows="2" placeholder="Enter text (press Enter for new line)">${escapeHtml(block.text)}</textarea>
      <label>Size (px)</label>
      <div class="size-row">
        <input type="range" class="block-size" min="${FONT_MIN}" max="${FONT_MAX}" value="${block.fontSize}">
        <span class="size-value">${block.fontSize}</span>
      </div>
      <label>Text color</label>
      <div class="color-row">
        <input type="color" class="block-color" value="${block.textColor || '#ffffff'}" title="Text color">
        <span class="color-value">${block.textColor || '#ffffff'}</span>
      </div>
      <button type="button" class="delete-block">Remove</button>
    `;
    const textInput = row.querySelector('.block-text');
    const sizeInput = row.querySelector('.block-size');
    const sizeValue = row.querySelector('.size-value');
    const colorInput = row.querySelector('.block-color');
    const colorValue = row.querySelector('.color-value');
    textInput.addEventListener('input', function () {
      block.text = this.value;
      draw();
    });
    textInput.addEventListener('focus', function () {
      blocksList.querySelectorAll('.block-row').forEach(r => r.classList.remove('selected'));
      row.classList.add('selected');
      draw();
    });
    sizeInput.addEventListener('input', function () {
      const v = parseInt(this.value, 10);
      block.fontSize = v;
      sizeValue.textContent = v;
      draw();
    });
    colorInput.addEventListener('input', function () {
      block.textColor = this.value;
      colorValue.textContent = this.value;
      draw();
    });
    row.querySelector('.delete-block').addEventListener('click', function () {
      removeBlock(block.id);
    });
    blocksList.appendChild(row);
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function initCanvasDrag() {
    canvas.addEventListener('mousedown', function (e) {
      if (!backgroundImage) return;
      const { x, y } = getCanvasCoords(e);
      const block = hitTest(x, y);
      if (block) {
        draggingBlock = block;
        dragOffsetX = x - block.x;
        dragOffsetY = y - block.y;
        canvas.style.cursor = 'grabbing';
        blocksList.querySelectorAll('.block-row').forEach(r => r.classList.remove('selected'));
        const row = document.querySelector(`.block-row[data-block-id="${block.id}"]`);
        if (row) row.classList.add('selected');
      }
    });

    canvas.addEventListener('mousemove', function (e) {
      if (!backgroundImage) return;
      const { x, y } = getCanvasCoords(e);
      if (draggingBlock) {
        draggingBlock.x = x - dragOffsetX;
        draggingBlock.y = y - dragOffsetY;
        draggingBlock.x = Math.max(0, Math.min(canvasWidth, draggingBlock.x));
        draggingBlock.y = Math.max(0, Math.min(canvasHeight, draggingBlock.y));
        draw();
      } else {
        const block = hitTest(x, y);
        canvas.style.cursor = block ? 'grab' : 'default';
      }
    });

    canvas.addEventListener('mouseup', function () {
      if (draggingBlock) {
        draggingBlock = null;
        canvas.style.cursor = '';
      }
    });

    canvas.addEventListener('mouseleave', function () {
      if (draggingBlock) {
        draggingBlock = null;
        canvas.style.cursor = '';
      }
    });
  }

  function downloadMeme() {
    if (!backgroundImage) return;
    draw(false);
    const data = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = data;
    a.download = 'meme.png';
    a.click();
    draw(true);
  }

  function renderTemplates() {
    templateThumbs.innerHTML = '';
    TEMPLATES.forEach(function (t) {
      const templateBtn = document.createElement('button');
      templateBtn.type = 'button';
      templateBtn.className = 'template-thumb';
      templateBtn.title = t.name;
      templateBtn.innerHTML = `
        <img src="${t.path}" alt="${escapeHtml(t.name)}">
        <span class="template-name">${escapeHtml(t.name)}</span>
      `;
      templateBtn.addEventListener('click', function () {
        loadImage(t.path);
        templateThumbs.querySelectorAll('.template-thumb').forEach(function (btn) { btn.classList.remove('selected'); });
        templateBtn.classList.add('selected');
        imageInput.value = '';
      });
      const thumbImg = templateBtn.querySelector('img');
      thumbImg.addEventListener('error', function () {
        thumbImg.alt = 'Failed to load';
      });
      templateThumbs.appendChild(templateBtn);
    });
  }

  imageInput.addEventListener('change', function () {
    const file = this.files?.[0];
    if (file) {
      loadImage(file);
      templateThumbs.querySelectorAll('.template-thumb').forEach(function (btn) { btn.classList.remove('selected'); });
    }
  });

  renderTemplates();

  addBlockBtn.addEventListener('click', addBlock);
  downloadBtn.addEventListener('click', downloadMeme);
  downloadBtn.hidden = true;
  downloadBtn.disabled = true;

  initCanvasDrag();

  setCanvasSize(canvasWidth, canvasHeight);
  updateUiState();
  draw();
})();
