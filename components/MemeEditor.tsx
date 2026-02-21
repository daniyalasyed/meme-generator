"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const CANVAS_MAX = 600;
const DEFAULT_FONT_SIZE = 48;
const FONT_MIN = 16;
const FONT_MAX = 120;
const STROKE_RATIO = 12;
const HIT_PADDING = 8;
const LINE_HEIGHT_RATIO = 1.15;
const MAX_TEXT_WIDTH_PAD = 40;

const TEMPLATES = [
  { path: "/templates/drake.jpg", name: "Drake Hotline Bling" },
  { path: "/templates/thinking.jpg", name: "I Bet He's Thinking About Other Women" },
  { path: "/templates/two-buttons.jpg", name: "Two Buttons" }
];

type TextBlock = {
  id: number;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  textColor: string;
};

type MemeEditorProps = {
  canPost: boolean;
  isPosting: boolean;
  onPost: (params: { blob: Blob; caption: string }) => Promise<void>;
};

export function MemeEditor({ canPost, isPosting, onPost }: MemeEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: CANVAS_MAX, height: CANVAS_MAX });
  const [blocks, setBlocks] = useState<TextBlock[]>([]);
  const [nextId, setNextId] = useState(1);
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);
  const [caption, setCaption] = useState("");
  const [selectedTemplatePath, setSelectedTemplatePath] = useState("");

  const dragRef = useRef<{
    blockId: number | null;
    offsetX: number;
    offsetY: number;
  }>({
    blockId: null,
    offsetX: 0,
    offsetY: 0
  });

  const hasImage = Boolean(backgroundImage);

  const selectedBlock = useMemo(
    () => blocks.find((block) => block.id === selectedBlockId) ?? null,
    [blocks, selectedBlockId]
  );

  function getCanvasContext() {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d");
  }

  function wrapBlockText(ctx: CanvasRenderingContext2D, block: TextBlock) {
    const font = `bold ${block.fontSize}px "Impact", "Arial Black", sans-serif`;
    ctx.save();
    ctx.font = font;
    const maxW = Math.max(80, canvasSize.width - MAX_TEXT_WIDTH_PAD);
    const raw = (block.text || "").trim() || " ";
    const segments = raw.split(/\n/);
    const lines: string[] = [];

    const wrapOne = (segment: string) => {
      const words = segment.split(/\s+/).filter(Boolean);
      let line = "";
      for (let i = 0; i < words.length; i += 1) {
        const trial = line ? `${line} ${words[i]}` : words[i];
        if (ctx.measureText(trial).width <= maxW) {
          line = trial;
        } else {
          if (line) lines.push(line);
          line = words[i];
        }
      }
      lines.push(line || " ");
    };

    segments.forEach(wrapOne);
    if (lines.length === 0) lines.push(" ");
    ctx.restore();
    return lines;
  }

  function getBlockBounds(ctx: CanvasRenderingContext2D, block: TextBlock) {
    const lines = wrapBlockText(ctx, block);
    ctx.save();
    ctx.font = `bold ${block.fontSize}px "Impact", "Arial Black", sans-serif`;
    let width = 0;
    lines.forEach((line) => {
      width = Math.max(width, ctx.measureText(line).width);
    });
    ctx.restore();
    const lineHeight = block.fontSize * LINE_HEIGHT_RATIO;
    const height = lines.length * lineHeight;
    const pad = HIT_PADDING + (block.fontSize / STROKE_RATIO) / 2;

    return {
      left: block.x - width / 2 - pad,
      right: block.x + width / 2 + pad,
      top: block.y - height / 2 - pad,
      bottom: block.y + height / 2 + pad
    };
  }

  function hitTest(ctx: CanvasRenderingContext2D, x: number, y: number) {
    for (let i = blocks.length - 1; i >= 0; i -= 1) {
      const bounds = getBlockBounds(ctx, blocks[i]);
      if (x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom) {
        return blocks[i];
      }
    }
    return null;
  }

  function drawBlock(
    ctx: CanvasRenderingContext2D,
    block: TextBlock,
    opts: { selected: boolean; showSelection: boolean }
  ) {
    const lines = wrapBlockText(ctx, block);
    const font = `bold ${block.fontSize}px "Impact", "Arial Black", sans-serif`;
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const lineHeight = block.fontSize * LINE_HEIGHT_RATIO;
    const totalHeight = lines.length * lineHeight;
    let y = block.y - totalHeight / 2 + lineHeight / 2;
    const lineWidth = Math.max(2, block.fontSize / STROKE_RATIO);
    ctx.strokeStyle = "black";
    ctx.lineWidth = lineWidth;
    ctx.fillStyle = block.textColor || "#ffffff";
    lines.forEach((line) => {
      ctx.strokeText(line, block.x, y);
      ctx.fillText(line, block.x, y);
      y += lineHeight;
    });
    if (opts.selected && opts.showSelection) {
      const b = getBlockBounds(ctx, block);
      ctx.strokeStyle = "rgba(232, 93, 76, 0.9)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(b.left, b.top, b.right - b.left, b.bottom - b.top);
      ctx.setLineDash([]);
    }
  }

  function draw(showSelection = true) {
    const canvas = canvasRef.current;
    const ctx = getCanvasContext();
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (backgroundImage) {
      ctx.drawImage(backgroundImage, 0, 0, canvasSize.width, canvasSize.height);
    }
    if (!backgroundImage) return;

    blocks.forEach((block) => {
      drawBlock(ctx, block, {
        selected: block.id === selectedBlockId,
        showSelection
      });
    });
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasSize.width, canvasSize.height]);

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backgroundImage, blocks, selectedBlockId]);

  function getCanvasCoords(e: MouseEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = getCanvasContext();
    if (!canvas || !ctx) return;

    const onMouseDown = (e: MouseEvent) => {
      if (!backgroundImage) return;
      const { x, y } = getCanvasCoords(e);
      const block = hitTest(ctx, x, y);
      if (!block) return;
      dragRef.current.blockId = block.id;
      dragRef.current.offsetX = x - block.x;
      dragRef.current.offsetY = y - block.y;
      setSelectedBlockId(block.id);
      canvas.style.cursor = "grabbing";
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!backgroundImage) return;
      const { x, y } = getCanvasCoords(e);
      const activeId = dragRef.current.blockId;
      if (activeId !== null) {
        setBlocks((prev) =>
          prev.map((block) =>
            block.id === activeId
              ? {
                  ...block,
                  x: clamp(x - dragRef.current.offsetX, 0, canvasSize.width),
                  y: clamp(y - dragRef.current.offsetY, 0, canvasSize.height)
                }
              : block
          )
        );
      } else {
        const hovering = hitTest(ctx, x, y);
        canvas.style.cursor = hovering ? "grab" : "default";
      }
    };

    const onMouseUp = () => {
      dragRef.current.blockId = null;
      canvas.style.cursor = "";
    };

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseleave", onMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mouseleave", onMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backgroundImage, blocks, canvasSize.width, canvasSize.height]);

  function createBlock(): TextBlock {
    return {
      id: nextId,
      text: "",
      x: canvasSize.width / 2,
      y: canvasSize.height / 2,
      fontSize: DEFAULT_FONT_SIZE,
      textColor: "#ffffff"
    };
  }

  function addBlock() {
    if (!backgroundImage) return;
    const block = createBlock();
    setBlocks((prev) => [...prev, block]);
    setSelectedBlockId(block.id);
    setNextId((prev) => prev + 1);
  }

  function removeBlock(id: number) {
    setBlocks((prev) => prev.filter((block) => block.id !== id));
    if (selectedBlockId === id) {
      setSelectedBlockId(null);
    }
    if (dragRef.current.blockId === id) {
      dragRef.current.blockId = null;
    }
  }

  async function loadImage(src: string | File) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    let urlToRevoke: string | null = null;

    const loaded = await new Promise<HTMLImageElement>((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load image."));
      if (typeof src === "string") {
        img.src = src;
      } else {
        urlToRevoke = URL.createObjectURL(src);
        img.src = urlToRevoke;
      }
    });

    if (urlToRevoke) {
      URL.revokeObjectURL(urlToRevoke);
    }

    const prevW = canvasSize.width;
    const prevH = canvasSize.height;

    let width = loaded.width;
    let height = loaded.height;

    if (width > CANVAS_MAX || height > CANVAS_MAX) {
      const scale = Math.min(CANVAS_MAX / width, CANVAS_MAX / height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    if (blocks.length > 0 && prevW > 0 && prevH > 0) {
      const scaleX = width / prevW;
      const scaleY = height / prevH;
      setBlocks((prev) =>
        prev.map((block) => ({
          ...block,
          x: Math.round(block.x * scaleX),
          y: Math.round(block.y * scaleY)
        }))
      );
    }

    setCanvasSize({ width, height });
    setBackgroundImage(loaded);
  }

  async function downloadMeme() {
    const canvas = canvasRef.current;
    if (!canvas || !backgroundImage) return;
    draw(false);
    const data = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = data;
    a.download = "meme.png";
    a.click();
    draw(true);
  }

  async function handlePostMeme() {
    if (!backgroundImage) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    draw(false);
    const blob = await canvasToBlob(canvas);
    draw(true);
    await onPost({ blob, caption });
  }

  return (
    <main className="workspace">
      <aside className="left-pane card" aria-label="Template selector">
        <h2 className="panel-title">Meme templates</h2>
        <label className="file-label full-width" htmlFor="imageInput">
          <span className="file-label-icon" aria-hidden="true">
            ↑
          </span>
          <span className="file-label-text">Upload your own image</span>
        </label>
        <input
          type="file"
          id="imageInput"
          accept="image/*"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            await loadImage(file);
            setSelectedTemplatePath("");
          }}
        />
        <p className="pane-help">Or choose a ready-made template below:</p>
        <div className="template-thumbs" aria-label="Template images">
          {TEMPLATES.map((template) => (
            <button
              key={template.path}
              type="button"
              className={`template-thumb ${selectedTemplatePath === template.path ? "selected" : ""}`}
              title={template.name}
              onClick={async () => {
                await loadImage(template.path);
                setSelectedTemplatePath(template.path);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={template.path} alt={template.name} />
              <span className="template-name">{template.name}</span>
            </button>
          ))}
        </div>
      </aside>

      <section className="center-pane">
        <div className="canvas-card card">
          <div className="canvas-toolbar">
            <p className="canvas-title">Workspace</p>
            <div className="toolbar-buttons">
              <button type="button" className="secondary-btn" onClick={downloadMeme} disabled={!hasImage}>
                Download meme
              </button>
              <button type="button" className="add-block-btn" onClick={handlePostMeme} disabled={!hasImage || !canPost || isPosting}>
                {isPosting ? "Posting..." : "Post meme"}
              </button>
            </div>
          </div>
          <div className="canvas-wrap">
            <canvas ref={canvasRef} id="memeCanvas" aria-label="Meme preview" />
            {!hasImage && <p className="no-image-hint">Upload an image or select a template to begin</p>}
          </div>
        </div>

        <div className="text-adder card" hidden={!hasImage}>
          <div className="text-adder-content">
            <div>
              <p className="text-adder-title">Text tools</p>
              <p className="text-adder-help">Add draggable text blocks and style them from the right panel.</p>
            </div>
            <button type="button" className="add-block-btn" onClick={addBlock}>
              + Add text block
            </button>
          </div>
          <div className="caption-input-wrap">
            <label htmlFor="captionInput">Caption for feed</label>
            <input
              id="captionInput"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Optional caption"
              maxLength={140}
            />
          </div>
        </div>
      </section>

      <aside className="right-pane card" aria-label="Text block editor" hidden={blocks.length === 0}>
        <h2 className="panel-title">Text blocks</h2>
        <p className="pane-help">Select a block to edit content, size, and color.</p>
        <div className="blocks-list">
          {blocks.map((block) => (
            <div
              key={block.id}
              className={`block-row ${selectedBlock?.id === block.id ? "selected" : ""}`}
              onClick={() => setSelectedBlockId(block.id)}
              onFocus={() => setSelectedBlockId(block.id)}
            >
              <label>Text</label>
              <textarea
                className="block-text"
                rows={2}
                placeholder="Enter text (press Enter for new line)"
                value={block.text}
                onChange={(e) => {
                  const value = e.target.value;
                  setBlocks((prev) =>
                    prev.map((item) => (item.id === block.id ? { ...item, text: value } : item))
                  );
                }}
              />
              <label>Size (px)</label>
              <div className="size-row">
                <input
                  type="range"
                  className="block-size"
                  min={FONT_MIN}
                  max={FONT_MAX}
                  value={block.fontSize}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setBlocks((prev) =>
                      prev.map((item) => (item.id === block.id ? { ...item, fontSize: value } : item))
                    );
                  }}
                />
                <span className="size-value">{block.fontSize}</span>
              </div>
              <label>Text color</label>
              <div className="color-row">
                <input
                  type="color"
                  className="block-color"
                  value={block.textColor}
                  onChange={(e) => {
                    const value = e.target.value;
                    setBlocks((prev) =>
                      prev.map((item) => (item.id === block.id ? { ...item, textColor: value } : item))
                    );
                  }}
                />
                <span className="color-value">{block.textColor}</span>
              </div>
              <button type="button" className="delete-block" onClick={() => removeBlock(block.id)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      </aside>
    </main>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Could not create image blob from canvas."));
        return;
      }
      resolve(blob);
    }, "image/png");
  });
}
