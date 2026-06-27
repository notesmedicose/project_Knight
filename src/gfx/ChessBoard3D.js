import * as THREE from 'three';
import { PieceGenerator } from './PieceGenerator.js';
import { ProceduralTextureGenerator } from './ProceduralTextureGenerator.js';

export class ChessBoard3D {
  constructor(scene) {
    this.scene = scene;
    this.pieceGenerator = new PieceGenerator();
    this.textures = null;
    
    // Board parameters
    this.tileSize = 1.0;
    this.boardOffset = 3.5; // (8 tiles * 1.0) / 2 - 0.5
    
    // Storage maps
    this.tiles = {}; // square e.g. "e4" -> THREE.Mesh
    this.pieceMeshes = {}; // square -> THREE.Group or Mesh
    this.highlightMarkers = [];

    // Selected state
    this.selectedSquare = null;
    this.selectedMarker = null;

    // Adaptive texture resolution
    this.textureResolution = navigator.onLine ? 1024 : 512;
    window.addEventListener('online', () => this._onConnectivityChange(true));
    window.addEventListener('offline', () => this._onConnectivityChange(false));

    this.createBoardMesh();
  }

  /**
   * Handle connectivity changes for adaptive texture resolution
   */
  _onConnectivityChange(isOnline) {
    const newRes = isOnline ? 1024 : 512;
    if (newRes !== this.textureResolution) {
      this.textureResolution = newRes;
      this._regenerateTextures();
    }
  }

  /**
   * Regenerate textures at the current resolution and reapply them
   */
  _regenerateTextures() {
    if (!this.renderer) return;
    const texGen = new ProceduralTextureGenerator(this.textureResolution);
    this.textures = texGen.generateAllTextures(this.renderer);
    this._applyTexturesToBoard();
    this.pieceGenerator.setTextures(this.textures);
    this.scene.environment = this.textures.envMap;
  }

  /**
   * Apply procedural textures to board elements
   */
  _applyTexturesToBoard() {
    const t = this.textures;
    if (!t) return;

    // Light tiles — golden oak wood grain
    if (t.lightTile) {
      this.lightTileMat.map = t.lightTile.map;
      this.lightTileMat.bumpMap = t.lightTile.bumpMap;
      this.lightTileMat.bumpScale = 0.04;
      this.lightTileMat.roughnessMap = t.tileRoughness || null;
      this.lightTileMat.needsUpdate = true;
    }

    // Dark tiles — walnut wood grain
    if (t.darkTile) {
      this.darkTileMat.map = t.darkTile.map;
      this.darkTileMat.bumpMap = t.darkTile.bumpMap;
      this.darkTileMat.bumpScale = 0.04;
      this.darkTileMat.roughnessMap = t.tileRoughness || null;
      this.darkTileMat.needsUpdate = true;
    }

    // Frame — mahogany
    if (t.mahogany) {
      this.frameMat.map = t.mahogany.map;
      this.frameMat.bumpMap = t.mahogany.bumpMap;
      this.frameMat.bumpScale = 0.08;
      this.frameMat.needsUpdate = true;
    }

    // Brass inlay — gold brushed metal
    if (t.gold) {
      this.brassMat.map = t.gold.map;
      this.brassMat.roughnessMap = t.gold.roughnessMap;
      this.brassMat.metalnessMap = t.gold.metalnessMap;
      this.brassMat.bumpMap = t.gold.bumpMap;
      this.brassMat.bumpScale = 0.02;
      this.brassMat.needsUpdate = true;
    }
  }

  /**
   * Translates algebraic notation ("a1" to "h8") to 3D Vector3 coordinates
   */
  squareToVector3(square) {
    const file = square.charCodeAt(0) - 97; // 'a' -> 0, 'h' -> 7
    const rank = parseInt(square[1]) - 1;   // '1' -> 0, '8' -> 7
    
    const x = file * this.tileSize - this.boardOffset;
    const z = (7 - rank) * this.tileSize - this.boardOffset;
    return new THREE.Vector3(x, 0.1, z);
  }

  vector3ToSquare(vec) {
    const fileIndex = Math.round((vec.x + this.boardOffset) / this.tileSize);
    const rankIndex = 7 - Math.round((vec.z + this.boardOffset) / this.tileSize);
    
    if (fileIndex >= 0 && fileIndex < 8 && rankIndex >= 0 && rankIndex < 8) {
      const fileChar = String.fromCharCode(97 + fileIndex);
      return `${fileChar}${rankIndex + 1}`;
    }
    return null;
  }

  createBoardMesh() {
    this.boardGroup = new THREE.Group();

    // 1. Realistic Wooden Tabletop
    const tableTopGeom = new THREE.BoxGeometry(18.0, 0.6, 18.0);
    const tableTopMat = new THREE.MeshStandardMaterial({
      color: 0x3d2314, // Rich polished mahogany wood
      roughness: 0.26,
      metalness: 0.1,
      clearcoat: 0.2
    });
    const tableTopMesh = new THREE.Mesh(tableTopGeom, tableTopMat);
    tableTopMesh.position.y = -0.7;
    tableTopMesh.receiveShadow = true;
    this.boardGroup.add(tableTopMesh);

    // 4 Wooden Table Legs
    const legGeom = new THREE.BoxGeometry(1.0, 6.0, 1.0);
    const legPositions = [
      [-7.5, -3.7, -7.5],
      [7.5, -3.7, -7.5],
      [-7.5, -3.7, 7.5],
      [7.5, -3.7, 7.5]
    ];
    legPositions.forEach(pos => {
      const legMesh = new THREE.Mesh(legGeom, tableTopMat);
      legMesh.position.set(pos[0], pos[1], pos[2]);
      legMesh.castShadow = true;
      legMesh.receiveShadow = true;
      this.boardGroup.add(legMesh);
    });

    // 2. Luxury Inlaid Wood Board Frame with Golden Brass Border
    const frameGeom = new THREE.BoxGeometry(9.4, 0.4, 9.4);
    this.frameMat = new THREE.MeshStandardMaterial({
      color: 0x2b170c, // Deep rich walnut wood
      roughness: 0.33,
      metalness: 0.0,
      clearcoat: 0.5
    });
    const frameMesh = new THREE.Mesh(frameGeom, this.frameMat);
    frameMesh.position.y = -0.2;
    frameMesh.receiveShadow = true;
    this.boardGroup.add(frameMesh);

    // Golden Brass Inlay Border Ring
    const brassInlayGeom = new THREE.BoxGeometry(8.15, 0.42, 8.15);
    this.brassMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // Royal Brass / Gold
      metalness: 0.9,
      roughness: 0.2
    });
    const brassMesh = new THREE.Mesh(brassInlayGeom, this.brassMat);
    brassMesh.position.y = -0.19;
    this.boardGroup.add(brassMesh);

    // Light and Dark Wood Inlaid Tile Materials (Matching Reference Photo!)
    this.lightTileMat = new THREE.MeshStandardMaterial({
      color: 0xdfb76c, // Golden Maple Wood
      roughness: 0.25,
      metalness: 0.05,
      clearcoat: 0.3
    });
    this.darkTileMat = new THREE.MeshStandardMaterial({
      color: 0x3d1d11, // Rich Mahogany Wood
      roughness: 0.3,
      metalness: 0.05,
      clearcoat: 0.3
    });

    const tileGeom = new THREE.BoxGeometry(this.tileSize, 0.1, this.tileSize * 0.98);

    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const isLight = (rank + file) % 2 === 1;
        const tileMesh = new THREE.Mesh(tileGeom, isLight ? this.lightTileMat : this.darkTileMat);
        
        const fileChar = String.fromCharCode(97 + file);
        const square = `${fileChar}${rank + 1}`;
        
        const pos = this.squareToVector3(square);
        tileMesh.position.set(pos.x, 0, pos.z);
        tileMesh.receiveShadow = true;
        tileMesh.userData = { square, isTile: true };

        this.tiles[square] = tileMesh;
        this.boardGroup.add(tileMesh);
      }
    }

    // 3. Turn Indicator Lights on Right side of board frame (matching user request)
    const bulbGeom = new THREE.CylinderGeometry(0.22, 0.22, 0.12, 32);
    
    // Black light (Top Right)
    this.blackLightMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      emissive: 0x1e293b,
      emissiveIntensity: 0.2,
      roughness: 0.2
    });
    this.blackLightMesh = new THREE.Mesh(bulbGeom, this.blackLightMat);
    this.blackLightMesh.position.set(4.28, 0.06, -3.5);
    this.boardGroup.add(this.blackLightMesh);

    // White light (Bottom Right)
    this.whiteLightMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      emissive: 0x10b981, // Initially White turn
      emissiveIntensity: 1.0,
      roughness: 0.2
    });
    this.whiteLightMesh = new THREE.Mesh(bulbGeom, this.whiteLightMat);
    this.whiteLightMesh.position.set(4.28, 0.06, 3.5);
    this.boardGroup.add(this.whiteLightMesh);

    this.scene.add(this.boardGroup);
  }

  /**
   * Updates indicator lights so only the active player's light glows
   */
  updateTurnLights(turnColor) {
    if (turnColor === 'w') {
      this.whiteLightMat.emissive.setHex(0x10b981); // Vibrant glowing emerald
      this.whiteLightMat.emissiveIntensity = 1.0;
      this.blackLightMat.emissive.setHex(0x1e293b);
      this.blackLightMat.emissiveIntensity = 0.2;
    } else {
      this.blackLightMat.emissive.setHex(0x10b981); // Vibrant glowing emerald
      this.blackLightMat.emissiveIntensity = 1.0;
      this.whiteLightMat.emissive.setHex(0x1e293b);
      this.whiteLightMat.emissiveIntensity = 0.2;
    }
  }

  /**
   * Syncs 3D pieces on the board with the chess.js board array representation
   */
  syncBoardState(boardArray) {
    // Clear existing piece meshes
    Object.keys(this.pieceMeshes).forEach(sq => {
      this.scene.remove(this.pieceMeshes[sq]);
    });
    this.pieceMeshes = {};

    for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
      for (let fileIndex = 0; fileIndex < 8; fileIndex++) {
        const piece = boardArray[rankIndex][fileIndex];
        if (piece) {
          const fileChar = String.fromCharCode(97 + fileIndex);
          const rankNum = 8 - rankIndex;
          const square = `${fileChar}${rankNum}`;
          
          const mesh = this.pieceGenerator.createPieceMesh(piece.type, piece.color);
          const pos = this.squareToVector3(square);
          mesh.position.copy(pos);
          mesh.userData.square = square;

          this.pieceMeshes[square] = mesh;
          this.scene.add(mesh);
        }
      }
    }
  }

  /**
   * Highlights valid target moves on the board with glowing rings
   */
  showMoveHighlights(validSquares) {
    this.clearHighlights();

    const ringGeom = new THREE.RingGeometry(0.2, 0.38, 32);
    ringGeom.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });

    validSquares.forEach(sq => {
      const pos = this.squareToVector3(sq);
      const marker = new THREE.Mesh(ringGeom, ringMat);
      marker.position.set(pos.x, 0.08, pos.z);
      marker.userData = { square: sq, isHighlight: true };
      this.highlightMarkers.push(marker);
      this.scene.add(marker);
    });
  }

  setSelectedSquare(square) {
    if (this.selectedMarker) {
      this.scene.remove(this.selectedMarker);
      this.selectedMarker = null;
    }

    this.selectedSquare = square;
    if (square) {
      const pos = this.squareToVector3(square);
      const boxGeom = new THREE.BoxGeometry(0.98, 0.12, 0.98);
      const boxMat = new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        wireframe: true
      });
      this.selectedMarker = new THREE.Mesh(boxGeom, boxMat);
      this.selectedMarker.position.set(pos.x, 0.02, pos.z);
      this.scene.add(this.selectedMarker);
    }
  }

  clearHighlights() {
    this.highlightMarkers.forEach(m => this.scene.remove(m));
    this.highlightMarkers = [];
  }

  /**
   * Animates piece moving smoothly from source to target square
   */
  animateMove(fromSq, toSq, onComplete) {
    const mesh = this.pieceMeshes[fromSq];
    if (!mesh) {
      if (onComplete) onComplete();
      return;
    }

    const startPos = mesh.position.clone();
    const targetPos = this.squareToVector3(toSq);
    
    // Remove target piece mesh if capture
    if (this.pieceMeshes[toSq]) {
      this.scene.remove(this.pieceMeshes[toSq]);
      delete this.pieceMeshes[toSq];
    }

    delete this.pieceMeshes[fromSq];
    this.pieceMeshes[toSq] = mesh;
    mesh.userData.square = toSq;

    const startTime = performance.now();
    const duration = 250; // ms

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth step easing
      const t = progress * progress * (3 - 2 * progress);
      
      mesh.position.x = startPos.x + (targetPos.x - startPos.x) * t;
      mesh.position.z = startPos.z + (targetPos.z - startPos.z) * t;
      // Arc jump height during movement
      mesh.position.y = startPos.y + Math.sin(progress * Math.PI) * 0.4;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        mesh.position.copy(targetPos);
        if (onComplete) onComplete();
      }
    };

    requestAnimationFrame(animate);
  }
}
