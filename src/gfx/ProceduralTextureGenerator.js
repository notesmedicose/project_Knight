import * as THREE from 'three';

/**
 * ProceduralTextureGenerator
 * 
 * Generates photorealistic PBR textures using pure Canvas 2D + noise algorithms.
 * No external image assets needed — everything is math-generated.
 * 
 * Capabilities:
 *   - Wood grain (walnut, golden oak, mahogany)
 *   - Marble veining (imperial white marble)
 *   - Gemstone crystal (ruby/garnet internal facets)
 *   - Brushed metal (gold/silver)
 *   - Bump maps derived from all texture types
 *   - Ornamental carved patterns for the frame
 *   - Environment map for real-time reflections
 */
export class ProceduralTextureGenerator {

  /**
   * @param {number} resolution - Texture size (512 or 1024)
   */
  constructor(resolution = 512) {
    this.res = Math.max(64, resolution);
  }

  /**
   * Update resolution and clear internal caches
   */
  setResolution(resolution) {
    this.res = Math.max(64, resolution);
    this.cache = {};
  }

  // ─── Noise Primitives ─────────────────────────────────────────

  /**
   * Deterministic pseudo-random hash from (x, y) integer coords → [0,1)
   */
  hash(x, y) {
    const n = x * 374761393 + y * 668265263;
    const s = Math.sin(n * 0.1031) * 43758.5453;
    return s - Math.floor(s);
  }

  /**
   * 2D Value noise with smoothstep interpolation
   */
  smoothNoise(x, y) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;

    const a = this.hash(ix, iy);
    const b = this.hash(ix + 1, iy);
    const c = this.hash(ix, iy + 1);
    const d = this.hash(ix + 1, iy + 1);

    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);

    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  }

  /**
   * Fractal Brownian Motion — layered noise for organic detail
   */
  fbm(x, y, octaves = 4) {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxVal = 0;
    for (let i = 0; i < octaves; i++) {
      value += amplitude * this.smoothNoise(x * frequency, y * frequency);
      maxVal += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }
    return value / maxVal;
  }

  /**
   * Cellular/Voronoi-like noise — gemstone facet patterns
   */
  cellularNoise(x, y, gridSize = 8) {
    const ix = Math.floor(x * gridSize);
    const iy = Math.floor(y * gridSize);
    const fx = x * gridSize - ix;
    const fy = y * gridSize - iy;

    let minDist = 1;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const cx = ix + dx;
        const cy = iy + dy;
        const ox = this.hash(cx, cy);
        const oy = this.hash(cx + 1000, cy + 1000);
        const px = dx + ox - fx;
        const py = dy + oy - fy;
        const dist = px * px + py * py;
        if (dist < minDist) minDist = dist;
      }
    }
    return Math.sqrt(minDist);
  }

  // ─── Canvas Helpers ───────────────────────────────────────────

  createCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = this.res;
    canvas.height = this.res;
    return canvas;
  }

  createTexture(canvas, wrapS = THREE.RepeatWrapping, wrapT = THREE.RepeatWrapping) {
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = wrapS;
    texture.wrapT = wrapT;
    texture.anisotropy = 16;
    texture.needsUpdate = true;
    return texture;
  }

  hexToRgb(hex) {
    return {
      r: (hex >> 16) & 0xff,
      g: (hex >> 8) & 0xff,
      b: hex & 0xff
    };
  }

  clamp(val, min = 0, max = 255) {
    return Math.min(max, Math.max(min, Math.round(val)));
  }

  // ─── Wood Grain Texture ──────────────────────────────────────

  /**
   * Generate a photorealistic wood grain texture
   * 
   * @param {number} baseColor - Hex color for the wood base
   * @param {number} grainColor - Hex color for the darker grain lines
   * @param {number} grainFreq - Frequency of primary grain lines
   * @param {string} name - Cache key name
   * @returns {THREE.CanvasTexture}
   */
  generateWoodGrain(baseColor, grainColor, grainFreq = 14, name = 'wood') {
    const canvas = this.createCanvas();
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(this.res, this.res);
    const data = imageData.data;

    const base = this.hexToRgb(baseColor);
    const grain = this.hexToRgb(grainColor);

    for (let y = 0; y < this.res; y++) {
      for (let x = 0; x < this.res; x++) {
        const nx = x / this.res;
        const ny = y / this.res;

        // Primary grain lines — sine wave along Y with noise modulation
        const noiseMod = this.fbm(nx * 4, ny * 2, 3) * 2.5;
        const grain1 = Math.sin(ny * grainFreq * Math.PI + noiseMod) * 0.5 + 0.5;

        // Secondary finer grain
        const noiseFine = this.fbm(nx * 8, ny * 4, 2) * 3;
        const grain2 = Math.sin(ny * grainFreq * 2.7 * Math.PI + noiseFine) * 0.5 + 0.5;

        // Micro-grain for texture
        const micro = this.fbm(nx * 20, ny * 10, 1) * 0.15;

        // Combine grain layers
        const grainVal = grain1 * 0.65 + grain2 * 0.25 + micro;

        // Natural knot feature
        const knotX = 0.3 + this.hash(42, 0) * 0.4;
        const knotY = 0.2 + this.hash(0, 42) * 0.6;
        const dx = nx - knotX;
        const dy = ny - knotY;
        const knotDist = Math.sqrt(dx * dx + dy * dy * 3);
        const knotInfluence = Math.max(0, 1 - knotDist * 6) * 0.3;
        const knotGrain = Math.sin(ny * grainFreq * Math.PI + knotDist * 10) * 0.5 + 0.5;
        const finalGrain = grainVal * (1 - knotInfluence) + knotGrain * knotInfluence;

        const idx = (y * this.res + x) * 4;
        data[idx]     = this.clamp(base.r + (grain.r - base.r) * finalGrain);
        data[idx + 1] = this.clamp(base.g + (grain.g - base.g) * finalGrain);
        data[idx + 2] = this.clamp(base.b + (grain.b - base.b) * finalGrain);
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    const tex = this.createTexture(canvas);
    tex.name = name;
    return tex;
  }

  /**
   * Bump map derived from wood grain height data
   */
  generateWoodBump(baseColor, grainColor, grainFreq = 14, name = 'wood_bump') {
    const canvas = this.createCanvas();
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(this.res, this.res);
    const data = imageData.data;

    const base = this.hexToRgb(baseColor);
    const grain = this.hexToRgb(grainColor);

    for (let y = 0; y < this.res; y++) {
      for (let x = 0; x < this.res; x++) {
        const nx = x / this.res;
        const ny = y / this.res;

        const noiseMod = this.fbm(nx * 4, ny * 2, 3) * 2.5;
        const grain1 = Math.sin(ny * grainFreq * Math.PI + noiseMod) * 0.5 + 0.5;
        const noiseFine = this.fbm(nx * 8, ny * 4, 2) * 3;
        const grain2 = Math.sin(ny * grainFreq * 2.7 * Math.PI + noiseFine) * 0.5 + 0.5;
        const micro = this.fbm(nx * 25, ny * 15, 1) * 0.2;
        const height = (grain1 * 0.6 + grain2 * 0.25 + micro) * 255;

        const idx = (y * this.res + x) * 4;
        data[idx] = data[idx + 1] = data[idx + 2] = this.clamp(height);
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    const tex = this.createTexture(canvas);
    tex.name = name;
    return tex;
  }


  // ─── Marble Vein Texture (White Pieces) ───────────────────────

  /**
   * Generate imperial white marble with elegant veining
   * 
   * @returns {{ map: THREE.CanvasTexture, bumpMap: THREE.CanvasTexture }}
   */
  generateMarbleTexture(name = 'marble') {
    const canvas = this.createCanvas();
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(this.res, this.res);
    const data = imageData.data;

    const base = { r: 246, g: 244, b: 238 };
    const vein = { r: 210, g: 205, b: 195 };
    const darkVein = { r: 180, g: 175, b: 165 };

    for (let y = 0; y < this.res; y++) {
      for (let x = 0; x < this.res; x++) {
        const nx = x / this.res;
        const ny = y / this.res;

        // Multi-octave FBM for organic marble veining
        const fbmVal = this.fbm(nx * 2.5, ny * 2.5, 6);
        
        // Threshold to create sharp vein edges
        const veinMask = Math.pow(Math.sin(fbmVal * Math.PI * 8), 3);
        const veinSharp = Math.max(0, Math.min(1, veinMask * 3 - 0.5));

        // Secondary fine veins
        const fineVeins = this.fbm(nx * 8 + 5.3, ny * 8 + 2.7, 3) * 0.3;

        // Subtle base variation
        const baseVar = (this.fbm(nx * 3 + 1.2, ny * 3 + 3.8, 2) - 0.5) * 0.08;

        // Mix colors — vein over base
        const mix1 = {
          r: vein.r * veinSharp + base.r * (1 - veinSharp),
          g: vein.g * veinSharp + base.g * (1 - veinSharp),
          b: vein.b * veinSharp + base.b * (1 - veinSharp)
        };

        const darkAccent = Math.max(0, veinSharp - 0.6) * 3;
        const mix2 = {
          r: darkVein.r * darkAccent + mix1.r * (1 - darkAccent),
          g: darkVein.g * darkAccent + mix1.g * (1 - darkAccent),
          b: darkVein.b * darkAccent + mix1.b * (1 - darkAccent)
        };

        const idx = (y * this.res + x) * 4;
        data[idx]     = this.clamp(mix2.r + baseVar * 255 + fineVeins * 20);
        data[idx + 1] = this.clamp(mix2.g + baseVar * 255 + fineVeins * 15);
        data[idx + 2] = this.clamp(mix2.b + baseVar * 255 + fineVeins * 10);
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    const tex = this.createTexture(canvas, THREE.RepeatWrapping, THREE.RepeatWrapping);
    tex.name = name;
    
    // Generate bump map
    const bumpTex = this._generateMarbleBump(base, vein, darkVein, name + '_bump');
    
    return { map: tex, bumpMap: bumpTex };
  }

  _generateMarbleBump(base, vein, darkVein, name) {
    const canvas = this.createCanvas();
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(this.res, this.res);
    const data = imageData.data;

    for (let y = 0; y < this.res; y++) {
      for (let x = 0; x < this.res; x++) {
        const nx = x / this.res;
        const ny = y / this.res;

        const fbmVal = this.fbm(nx * 2.5, ny * 2.5, 6);
        const veinMask = Math.pow(Math.sin(fbmVal * Math.PI * 8), 3);
        const height = (veinMask * 0.7 + this.fbm(nx * 5, ny * 5, 2) * 0.3) * 255;

        const idx = (y * this.res + x) * 4;
        data[idx] = data[idx + 1] = data[idx + 2] = this.clamp(height);
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    const tex = this.createTexture(canvas);
    tex.name = name;
    return tex;
  }
  // ─── Ruby / Garnet Crystal Texture (Red Pieces) ─────────────

  /**
   * Generate ruby/garnet crystal texture with internal facet patterns
   * 
   * @returns {{ map: THREE.CanvasTexture, bumpMap: THREE.CanvasTexture }}
   */
  generateRubyCrystalTexture(name = 'ruby') {
    const canvas = this.createCanvas();
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(this.res, this.res);
    const data = imageData.data;

    const base = { r: 180, g: 12, b: 28 };
    const light = { r: 220, g: 50, b: 60 };
    const dark = { r: 100, g: 0, b: 10 };

    for (let y = 0; y < this.res; y++) {
      for (let x = 0; x < this.res; x++) {
        const nx = x / this.res;
        const ny = y / this.res;

        // Cellular noise for crystal facet pattern
        const cell = this.cellularNoise(nx * 3, ny * 3, 6);
        const cell2 = this.cellularNoise(nx * 5 + 10, ny * 5 + 10, 8);

        // FBM for subtle internal cloudiness
        const cloud = this.fbm(nx * 4, ny * 4, 3);

        // Facet shimmer — hexagonal-like grid
        const gridX = Math.sin(nx * 20 * Math.PI) * 0.5 + 0.5;
        const gridY = Math.sin(ny * 20 * Math.PI) * 0.5 + 0.5;
        const facet = (gridX * gridY) * 0.15;

        // Combine patterns
        const crystalPattern = cell * 0.5 + cell2 * 0.2 + cloud * 0.2 + facet;

        const idx = (y * this.res + x) * 4;
        data[idx]     = this.clamp(base.r + (light.r - base.r) * crystalPattern);
        data[idx + 1] = this.clamp(base.g + (light.g - base.g) * crystalPattern * 0.3);
        data[idx + 2] = this.clamp(base.b + (light.b - base.b) * crystalPattern * 0.2);
        data[idx + 3] = this.clamp(220 + cloud * 35);
      }
    }

    ctx.putImageData(imageData, 0, 0);
    const tex = this.createTexture(canvas);
    tex.name = name;

    // Generate bump map for crystal facets
    const bumpTex = this._generateRubyBump(name + '_bump');

    return { map: tex, bumpMap: bumpTex };
  }

  _generateRubyBump(name) {
    const canvas = this.createCanvas();
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(this.res, this.res);
    const data = imageData.data;

    for (let y = 0; y < this.res; y++) {
      for (let x = 0; x < this.res; x++) {
        const nx = x / this.res;
        const ny = y / this.res;

        const cell = this.cellularNoise(nx * 3, ny * 3, 6);
        const cell2 = this.cellularNoise(nx * 5 + 10, ny * 5 + 10, 8);
        const height = (cell * 0.6 + cell2 * 0.4) * 255;

        const idx = (y * this.res + x) * 4;
        data[idx] = data[idx + 1] = data[idx + 2] = this.clamp(128 + (height - 128) * 0.5);
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    const tex = this.createTexture(canvas);
    tex.name = name;
    return tex;
  }
  // ─── Brushed Gold Metal Texture (Accents) ────────────────────

  /**
   * Generate antique brushed gold with RADIAL micro scratches
   * Spec: "Radial micro scratches" on antique gold, roughness 0.22, metalness 1.0
   */
  generateBrushedGold(name = 'gold') {
    const canvas = this.createCanvas();
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(this.res, this.res);
    const data = imageData.data;

    // Antique gold: deeper warmer tones per spec
    const base = { r: 200, g: 165, b: 50 };
    const highlight = { r: 235, g: 205, b: 95 };
    const dark = { r: 150, g: 120, b: 25 };
    const cx = 0.5, cy = 0.5;

    for (let y = 0; y < this.res; y++) {
      for (let x = 0; x < this.res; x++) {
        const nx = x / this.res;
        const ny = y / this.res;
        const dx = nx - cx;
        const dy = ny - cy;
        const angle = Math.atan2(dy, dx);
        const radius = Math.sqrt(dx * dx + dy * dy);

        // Radial brush streaks — concentric circles (spec: radial scratches)
        const radialBrush = this.fbm(angle * 8 / Math.PI, radius * 60, 2) * 0.5 + 0.5;
        const microScratches = this.fbm(angle * 20 / Math.PI, radius * 120, 1) * 0.2;
        const grain = this.fbm(nx * 40, ny * 40, 1) * 0.06;
        const edgeDark = 1.0 - radius * 0.12;
        const metalVal = (radialBrush + microScratches + grain) * edgeDark;

        const idx = (y * this.res + x) * 4;
        data[idx]     = this.clamp(dark.r + (highlight.r - dark.r) * metalVal);
        data[idx + 1] = this.clamp(dark.g + (highlight.g - dark.g) * metalVal);
        data[idx + 2] = this.clamp(dark.b + (highlight.b - dark.b) * metalVal);
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    const tex = this.createTexture(canvas);
    tex.name = name;

    // Roughness map — radial pattern, spec avg 0.22
    const roughCanvas = this.createCanvas();
    const rCtx = roughCanvas.getContext('2d');
    const rData = rCtx.createImageData(this.res, this.res);
    const rd = rData.data;
    for (let y = 0; y < this.res; y++) {
      for (let x = 0; x < this.res; x++) {
        const nx = x / this.res;
        const ny = y / this.res;
        const dx = nx - cx;
        const dy = ny - cy;
        const angle = Math.atan2(dy, dx);
        const radius = Math.sqrt(dx * dx + dy * dy);
        const brush = this.fbm(angle * 8 / Math.PI, radius * 60, 2);
        const roughness = 0.18 + brush * 0.10;
        const idx = (y * this.res + x) * 4;
        rd[idx] = rd[idx + 1] = rd[idx + 2] = this.clamp(roughness * 255);
        rd[idx + 3] = 255;
      }
    }
    rCtx.putImageData(rData, 0, 0);
    const roughnessMap = this.createTexture(roughCanvas);
    roughnessMap.name = name + '_roughness';

    // Metalness map — fully metallic 1.0 per spec
    const metalCanvas = this.createCanvas();
    const mCtx = metalCanvas.getContext('2d');
    const mData = mCtx.createImageData(this.res, this.res);
    const md = mData.data;
    for (let i = 0; i < md.length; i += 4) {
      md[i] = md[i + 1] = md[i + 2] = 255;
      md[i + 3] = 255;
    }
    mCtx.putImageData(mData, 0, 0);
    const metalnessMap = this.createTexture(metalCanvas);
    metalnessMap.name = name + '_metalness';

    // Bump map — radial micro scratches relief
    const bumpCanvas = this.createCanvas();
    const bCtx = bumpCanvas.getContext('2d');
    const bData = bCtx.createImageData(this.res, this.res);
    const bd = bData.data;
    for (let y = 0; y < this.res; y++) {
      for (let x = 0; x < this.res; x++) {
        const nx = x / this.res;
        const ny = y / this.res;
        const dx = nx - cx;
        const dy = ny - cy;
        const angle = Math.atan2(dy, dx);
        const radius = Math.sqrt(dx * dx + dy * dy);
        const brush = this.fbm(angle * 8 / Math.PI, radius * 60, 2);
        const height = brush * 40;
        const idx = (y * this.res + x) * 4;
        bd[idx] = bd[idx + 1] = bd[idx + 2] = this.clamp(128 + height);
        bd[idx + 3] = 255;
      }
    }
    bCtx.putImageData(bData, 0, 0);
    const bumpMap = this.createTexture(bumpCanvas);
    bumpMap.name = name + '_bump';

    return { map: tex, roughnessMap, metalnessMap, bumpMap };
  }


  // ─── Alternating Direction Wood Grain (per spec) ─────────────

  /**
   * Generate wood grain with alternating direction (90° rotation per spec)
   * Spec: "Direction alternating every square", "Never tile textures", "unique grain"
   */
  generateWoodGrainAlt(baseColor, grainColor, grainFreq = 14, seedX = 0, seedY = 0, rotate = false, name = 'wood_alt') {
    const canvas = this.createCanvas();
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(this.res, this.res);
    const data = imageData.data;
    const base = this.hexToRgb(baseColor);
    const grain = this.hexToRgb(grainColor);
    const sX = seedX * 1000;
    const sY = seedY * 1000;
    for (let y = 0; y < this.res; y++) {
      for (let x = 0; x < this.res; x++) {
        let nx = x / this.res, ny = y / this.res;
        if (rotate) { const t = nx; nx = ny; ny = t; }
        const ux = nx + sX, uy = ny + sY;
        const g1 = Math.sin(uy * grainFreq * Math.PI + this.fbm(ux*4, uy*2, 3)*2.5) * 0.5 + 0.5;
        const g2 = Math.sin(uy * grainFreq*2.7 * Math.PI + this.fbm(ux*8, uy*4, 2)*3) * 0.5 + 0.5;
        const micro = this.fbm(ux * 20, uy * 10, 1) * 0.15;
        const grainVal = g1 * 0.65 + g2 * 0.25 + micro;
        const kx = 0.2 + this.hash(42 + sX, 0) * 0.6;
        const ky = 0.2 + this.hash(0, 42 + sY) * 0.6;
        const ki = Math.max(0, 1 - Math.sqrt((nx-kx)**2 + (ny-ky)**2*3) * 5) * 0.25;
        const fg = grainVal * (1 - ki) + grainVal * ki;
        const idx = (y*this.res + x) * 4;
        data[idx] = this.clamp(base.r + (grain.r - base.r) * fg);
        data[idx+1] = this.clamp(base.g + (grain.g - base.g) * fg);
        data[idx+2] = this.clamp(base.b + (grain.b - base.b) * fg);
        data[idx+3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    const tex = this.createTexture(canvas);
    tex.name = name;
    return tex;
  }

  generateWoodBumpAlt(baseColor, grainColor, grainFreq = 14, seedX = 0, seedY = 0, rotate = false, name = 'wood_bump_alt') {
    const canvas = this.createCanvas();
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(this.res, this.res);
    const data = imageData.data;
    const base = this.hexToRgb(baseColor);
    const grain = this.hexToRgb(grainColor);
    const sX = seedX * 1000;
    const sY = seedY * 1000;
    for (let y = 0; y < this.res; y++) {
      for (let x = 0; x < this.res; x++) {
        let nx = x / this.res, ny = y / this.res;
        if (rotate) { const t = nx; nx = ny; ny = t; }
        const ux = nx + sX, uy = ny + sY;
        const g1 = Math.sin(uy * grainFreq * Math.PI + this.fbm(ux*4, uy*2, 3)*2.5) * 0.5 + 0.5;
        const g2 = Math.sin(uy * grainFreq*2.7 * Math.PI + this.fbm(ux*8, uy*4, 2)*3) * 0.5 + 0.5;
        const height = (g1 * 0.6 + g2 * 0.25 + this.fbm(ux*25, uy*15, 1)*0.2) * 255;
        const idx = (y*this.res + x) * 4;
        data[idx] = data[idx+1] = data[idx+2] = this.clamp(height);
        data[idx+3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    const tex = this.createTexture(canvas);
    tex.name = name;
    return tex;
  }

  // ─── Mahogany Frame Texture ──────────────────────────────────

  /**
   * Generate dark mahogany wood with carved ornamental border pattern
   * 
   * @returns {{ map: THREE.CanvasTexture, bumpMap: THREE.CanvasTexture }}
   */
  generateMahoganyFrame(name = 'mahogany') {
    const canvas = this.createCanvas();
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(this.res, this.res);
    const data = imageData.data;

    const base = { r: 55, g: 25, b: 15 };
    const grain = { r: 90, g: 40, b: 25 };
    const darkGrain = { r: 35, g: 15, b: 8 };

    for (let y = 0; y < this.res; y++) {
      for (let x = 0; x < this.res; x++) {
        const nx = x / this.res;
        const ny = y / this.res;

        const noiseMod = this.fbm(nx * 3, ny * 3, 3) * 2;
        const grain1 = Math.sin(ny * 18 * Math.PI + noiseMod) * 0.5 + 0.5;
        const grain2 = Math.sin(ny * 30 * Math.PI + this.fbm(nx * 6, ny * 2, 2) * 3) * 0.5 + 0.5;
        const micro = this.fbm(nx * 25, ny * 15, 1) * 0.12;

        const grainVal = grain1 * 0.6 + grain2 * 0.28 + micro;

        const idx = (y * this.res + x) * 4;
        data[idx]     = this.clamp(base.r + (grain.r - base.r) * grainVal);
        data[idx + 1] = this.clamp((base.g + (grain.g - base.g) * grainVal) * 0.9);
        data[idx + 2] = this.clamp((base.b + (grain.b - base.b) * grainVal) * 0.8);
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    const tex = this.createTexture(canvas);
    tex.name = name;

    const bumpTex = this._generateOrnamentalBump(name + '_bump');
    return { map: tex, bumpMap: bumpTex };
  }

  /**
   * Ornamental carved border pattern for the frame
   */
  _generateOrnamentalBump(name) {
    const canvas = this.createCanvas();
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(this.res, this.res);
    const data = imageData.data;
    const motifSize = this.res / 12;

    for (let y = 0; y < this.res; y++) {
      for (let x = 0; x < this.res; x++) {
        const nx = x / this.res;
        const ny = y / this.res;
        const mx = (x % motifSize) / motifSize;
        const my = (y % motifSize) / motifSize;
        const diamond = Math.max(Math.abs(mx - 0.5) * 2, Math.abs(my - 0.5) * 2);
        const frameEdge = Math.max(Math.abs(mx - 0.5) * 2, Math.abs(my - 0.5) * 2);

        let height = 0.5;
        if (frameEdge > 0.85) height = 0.8;
        else if (diamond < 0.5) height = 0.3;
        else if (diamond < 0.7) height = 0.6;

        const carveNoise = this.fbm(nx * 30, ny * 30, 2) * 0.1;
        height = this.clamp((height + carveNoise) * 255);

        const idx = (y * this.res + x) * 4;
        data[idx] = data[idx + 1] = data[idx + 2] = height;
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    const tex = this.createTexture(canvas);
    tex.name = name;
    return tex;
  }

  // ─── Roughness Map Generator ─────────────────────────────────

  generateRoughnessMap(minRough = 0.2, maxRough = 0.6, scale = 3, name = 'roughness') {
    const canvas = this.createCanvas();
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(this.res, this.res);
    const data = imageData.data;

    for (let y = 0; y < this.res; y++) {
      for (let x = 0; x < this.res; x++) {
        const nx = x / this.res;
        const ny = y / this.res;
        const noise = this.fbm(nx * scale, ny * scale, 3);
        const roughness = minRough + noise * (maxRough - minRough);
        const idx = (y * this.res + x) * 4;
        data[idx] = data[idx + 1] = data[idx + 2] = this.clamp(roughness * 255);
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    const tex = this.createTexture(canvas);
    tex.name = name;
    return tex;
  }

  // ─── Environment Map Generator ───────────────────────────────

  generateEnvironmentMap(renderer) {
    const width = 1024;
    const height = 512;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#1a1a2e');
    grad.addColorStop(0.2, '#2a2a44');
    grad.addColorStop(0.35, '#3d3d5c');
    grad.addColorStop(0.5, '#4a4a6e');
    grad.addColorStop(0.65, '#3d3d5c');
    grad.addColorStop(0.8, '#2a2a44');
    grad.addColorStop(1, '#0d0d1a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const keySpot = ctx.createRadialGradient(width * 0.4, height * 0.3, 0, width * 0.4, height * 0.3, 250);
    keySpot.addColorStop(0, 'rgba(255, 220, 180, 0.15)');
    keySpot.addColorStop(0.5, 'rgba(255, 200, 150, 0.05)');
    keySpot.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = keySpot;
    ctx.fillRect(0, 0, width, height);

    const fillSpot = ctx.createRadialGradient(width * 0.7, height * 0.6, 0, width * 0.7, height * 0.6, 200);
    fillSpot.addColorStop(0, 'rgba(200, 220, 255, 0.08)');
    fillSpot.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = fillSpot;
    ctx.fillRect(0, 0, width, height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.name = 'env_map';
    texture.needsUpdate = true;

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    pmremGenerator.dispose();
    return envMap;
  }

  // ─── Bulk Texture Generation ─────────────────────────────────

  generateAllTextures(renderer) {
    const lightWood = this.generateWoodGrain(0xf5e8d0, 0xd4b896, 14, 'light_tile');
    const lightWoodBump = this.generateWoodBump(0xf5e8d0, 0xd4b896, 14, 'light_tile_bump');
    const darkWood = this.generateWoodGrain(0x4a3020, 0x2a1a10, 14, 'dark_tile');
    const darkWoodBump = this.generateWoodBump(0x4a3020, 0x2a1a10, 14, 'dark_tile_bump');
    const marble = this.generateMarbleTexture('marble');
    const ruby = this.generateRubyCrystalTexture('ruby');
    const gold = this.generateBrushedGold('gold');
    const mahogany = this.generateMahoganyFrame('mahogany');
    const tileRoughness = this.generateRoughnessMap(0.35, 0.65, 4, 'tile_roughness');
    const envMap = this.generateEnvironmentMap(renderer);

    return {
      lightTile: { map: lightWood, bumpMap: lightWoodBump },
      darkTile: { map: darkWood, bumpMap: darkWoodBump },
      tileRoughness,
      marble,
      ruby,
      gold,
      mahogany,
      envMap,
    };
  }
}