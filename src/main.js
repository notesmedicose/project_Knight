import * as THREE from 'three';
import { SceneManager } from './gfx/SceneManager.js';
import { ChessBoard3D } from './gfx/ChessBoard3D.js';
import { ProceduralTextureGenerator } from './gfx/ProceduralTextureGenerator.js';
import { ChessEngine } from './logic/ChessEngine.js';
import { BotAI } from './logic/BotAI.js';
import { SoundManager } from './audio/SoundManager.js';
import { UIManager } from './ui/UIManager.js';
import { AdManager } from './ads/AdManager.js';
import { TalkingTom } from './logic/TalkingTom.js';
import { TomUI } from './ui/TomUI.js';

class GameApp {
  constructor() {
    this.gameMode = 'bot';
    this.playerColor = 'w';
    this.isAnimating = false;
    this.sceneMgr = new SceneManager('canvas-container');
    this.board3D = new ChessBoard3D(this.sceneMgr.scene);
    this.engine = new ChessEngine();
    this.bot = new BotAI('medium');
    this.sound = new SoundManager();
    this.ui = new UIManager();
    this.ads = new AdManager();
    this.tom = new TalkingTom('bot');
    this.tomUI = new TomUI();
    this.init();
  }

  async init() {
    this._initTextures();
    this.board3D.syncBoardState(this.engine.getBoard());
    this.setupUIEvents();
    this.setupInputEvents();
    this.setupTomEvents();
    this.animate();
    await this.ads.initialize();
  }

  _initTextures() {
    const resolution = this.board3D.textureResolution;
    const texGen = new ProceduralTextureGenerator(resolution);
    this.board3D.renderer = this.sceneMgr.renderer;
    const textures = texGen.generateAllTextures(this.sceneMgr.renderer);
    this.board3D.textures = textures;
    this.board3D._applyTexturesToBoard();
    this.board3D.pieceGenerator.setTextures(textures);
    this.sceneMgr.scene.environment = textures.envMap;
  }

  setupUIEvents() {
    this.ui.btnModeBot.addEventListener('click', () => {
      this.ui.botDifficultySelector.classList.remove('hidden');
    });
    this.ui.btnModeFriend.addEventListener('click', () => {
      this.playerColor = 'w';
      this.startNewGame('friend');
    });
    this.ui.btnStartBotGame.addEventListener('click', () => {
      this.bot.setDifficulty(this.ui.selectedDifficulty);
      this.playerColor = this.ui.selectedSide || 'w';
      this.startNewGame('bot');
    });
    this.ui.btnHudMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      this.sound.playMove();
      this.board3D.setSelectedSquare(null);
      this.board3D.clearHighlights();
      this.ui.showMainMenu();
    });
    this.ui.btnHudReset.addEventListener('click', (e) => {
      e.stopPropagation();
      this.sound.playMove();
      this.startNewGame(this.gameMode);
    });
    this.ui.btnHudUndo.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.isAnimating) return;
      this.ui.gameOverModal.classList.add('hidden');
      const history = this.engine.history();
      if (history.length === 0) return;
      if (this.gameMode === 'bot') {
        if (this.engine.turn() === this.playerColor && history.length >= 2) {
          this.engine.undo();
          this.engine.undo();
        } else {
          this.engine.undo();
        }
      } else {
        this.engine.undo();
      }
      this.sound.playMove();
      this.board3D.setSelectedSquare(null);
      this.board3D.clearHighlights();
      this.board3D.syncBoardState(this.engine.getBoard());
      this.board3D.updateTurnLights(this.engine.turn());
      this.ui.updateTurn(this.engine.turn(), this.engine.inCheck());
      this.ui.updateCapturedPieces(this.engine.history());
    });
    this.ui.btnHudCamera.addEventListener('click', (e) => {
      e.stopPropagation();
      const p = (this.gameMode === 'friend' && this.engine.turn() === 'b') ? 'b' : this.playerColor;
      this.sceneMgr.resetCameraView(p);
    });
    this.ui.btnHudSound.addEventListener('click', (e) => {
      e.stopPropagation();
      this.ui.btnHudSound.textContent = this.sound.toggleSound() ? '🔊' : '🔇';
    });
    this.ui.btnRestartGame.addEventListener('click', () => {
      this.startNewGame(this.gameMode);
    });
    this.ui.btnReturnMenu.addEventListener('click', () => {
      this.ui.showMainMenu();
    });
  }

  setupInputEvents() {
    const dom = this.sceneMgr.renderer.domElement;
    const handler = (event) => {
      if (this.isAnimating || this.engine.isGameOver()) return;
      if (this.gameMode === 'bot') {
        const bc = this.playerColor === 'w' ? 'b' : 'w';
        if (this.engine.turn() === bc) return;
      }
      const rect = dom.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      this.sceneMgr.mouse.set(x, y);
      this.sceneMgr.raycaster.setFromCamera(this.sceneMgr.mouse, this.sceneMgr.camera);
      const tiles = this.board3D.getAllTileMeshes();
      const hits = this.sceneMgr.raycaster.intersectObjects(tiles);
      if (hits.length > 0) {
        this.handleSquareClick(hits[0].object.userData.square);
      }
    };
    dom.addEventListener('pointerdown', handler);
    dom.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handler(e.touches[0]);
    }, { passive: false });
  }

  handleSquareClick(sq) {
    const from = this.board3D.selectedSquare;
    if (!from) {
      const p = this.engine.game.get(sq);
      if (p && p.color === this.engine.turn()) {
        this.board3D.setSelectedSquare(sq);
        this.board3D.showMoveHighlights(this.engine.getValidMoves(sq));
      }
      return;
    }
    if (sq === from) {
      this.board3D.setSelectedSquare(null);
      this.board3D.clearHighlights();
      return;
    }
    const moves = this.engine.getValidMoves(from);
    if (moves.includes(sq)) {
      const piece = this.engine.game.get(from);
      const promo = piece.type === 'p' && (sq[1] === '8' || sq[1] === '1');
      if (promo) {
        this.ui.showPromotionModal((t) => this.executeMove(from, sq, t));
      } else {
        this.executeMove(from, sq, 'q');
      }
    } else {
      this.board3D.setSelectedSquare(null);
      this.board3D.clearHighlights();
    }
  }

  executeMove(from, to, promo = 'q') {
    this.isAnimating = true;
    this.board3D.setSelectedSquare(null);
    this.board3D.clearHighlights();
    const isCap = !!this.engine.game.get(to);
    const result = this.engine.makeMove(from, to, promo);
    if (result) {
      const userMove = this.gameMode === 'bot' && result.color === this.playerColor;
      this.board3D.animateMove(from, to, () => {
        this.isAnimating = false;
        if (isCap) this.sound.playCapture();
        else this.sound.playMove();
        this.board3D.syncBoardState(this.engine.getBoard());
        this.board3D.updateTurnLights(this.engine.turn());
        this.ui.updateTurn(this.engine.turn(), this.engine.inCheck());
        this.ui.updateCapturedPieces(this.engine.history());
        const chk = this.engine.inCheck();
        if (chk) this.sound.playCheck();
        if (userMove) {
          const ev = this.tom.evaluateMove(this.engine.game, from, to, promo);
          this.tomUI.bounce();
          if (this.engine.isCheckmate()) { this.checkGameOver(); return; }
          else if (this.engine.isDraw()) { this.checkGameOver(); return; }
          else if (chk && isCap) {
            this.tomUI.showMessage(this.tom.getMotivationalMessage('capture'), 3000);
            setTimeout(() => this.tomUI.showMessage(this.tom.getMotivationalMessage('check'), 3000), 3200);
          } else if (chk) {
            this.tomUI.showMessage(this.tom.getMotivationalMessage('check'), 3000);
          } else if (isCap) {
            this.tomUI.showMessage(this.tom.getMotivationalMessage('capture'), 3000);
          } else {
            this.tomUI.showMessage(this.tom.getMotivationalMessage('move', ev.quality), 3000);
          }
          if (this.gameMode === 'bot' && !this.engine.isGameOver()) {
            this.tomUI.setHintButtonVisible(true);
          }
        }
        if (!userMove && (this.engine.isCheckmate() || this.engine.isDraw())) {
          this.checkGameOver();
          return;
        }
        const bc = this.playerColor === 'w' ? 'b' : 'w';
        if (this.gameMode === 'bot' && this.engine.turn() === bc) {
          this.triggerBotMove();
        }
      });
    } else {
      this.isAnimating = false;
    }
  }

  async triggerBotMove() {
    this.isAnimating = true;
    this.tomUI.hideSpeech();
    this.tomUI.setHintButtonVisible(false);
    this.tomUI.showMessage("Tom's turn... calculating... 🧠", 1500);
    const move = await this.bot.calculateBestMove(this.engine.game);
    this.isAnimating = false;
    if (move) this.executeMove(move.from, move.to, move.promotion || 'q');
  }

  checkGameOver() {
    if (!this.engine.isGameOver()) return false;
    this.sound.playGameOver();
    this.tomUI.setHintButtonVisible(false);
    this.tomUI.hideSpeech();
    if (this.engine.isCheckmate()) {
      const w = this.engine.turn() === 'w' ? 'Black' : 'White';
      this.ui.showGameOver('CHECKMATE!', w + ' Wins the Game!');
      if (this.gameMode === 'bot') {
        const win = w.toLowerCase() !== this.playerColor;
        setTimeout(() => {
          if (win) {
            this.tomUI.showMessage(this.tom.getMotivationalMessage('checkmate'), 6000);
            this.tomUI.bounce();
          } else {
            this.tomUI.showMessage(this.tom.getMotivationalMessage('gameover_loss'), 5000);
          }
        }, 600);
      }
    } else if (this.engine.isDraw()) {
      this.ui.showGameOver('DRAW!', 'The game ended in a draw.');
      setTimeout(() => this.tomUI.showMessage(this.tom.getMotivationalMessage('gameover_draw'), 5000), 600);
    }
    return true;
  }

  startNewGame(mode) {
    this.gameMode = mode;
    this.isAnimating = false;
    this.engine.reset();
    this.board3D.setSelectedSquare(null);
    this.board3D.clearHighlights();
    this.board3D.syncBoardState(this.engine.getBoard());
    this.board3D.updateTurnLights('w');
    const cam = mode === 'bot' ? this.playerColor : 'w';
    this.sceneMgr.resetCameraView(cam);
    this.ui.showGameHUD(mode, this.playerColor);
    this.ui.updateTurn('w', false);
    this.ui.updateCapturedPieces([]);
    this.tom.setGameMode(mode);
    this.tomUI.setGameModeVisual(mode);
    this.tomUI.hideSpeech();
    this.tomUI.setHintButtonVisible(false);
    setTimeout(() => this.tomUI.showMessage(this.tom.getWelcomeMessage(), 4000), 500);
    if (mode === 'bot' && this.playerColor === 'b') {
      setTimeout(() => this.triggerBotMove(), 400);
    }
  }

  setupTomEvents() {
    this.tomUI.onHintClick(async () => {
      if (this.engine.isGameOver()) {
        this.tomUI.showMessage("Game's over fam! No more moves to hint! 🎬");
        return;
      }
      this.tomUI.setHintButtonVisible(false);
      this.tomUI.showMessage("Tom's thinking... 🤔", 1500);
      setTimeout(async () => {
        const hint = await this.tom.getBestMoveHint(this.engine.game, this.bot);
        this.tomUI.showHint(hint);
        this.tomUI.bounce();
        setTimeout(() => {
          if (!this.engine.isGameOver()) this.tomUI.setHintButtonVisible(true);
        }, 4000);
      }, 600);
    });
    this.tomUI.onAvatarClick(() => {
      if (this.gameMode === 'friend' && !this.engine.isGameOver()) {
        this.tomUI.setHintButtonVisible(true);
        this.tomUI.showMessage(this.tom.getFriendHintOffer(), 3000);
      } else if (this.gameMode === 'bot' && !this.engine.isGameOver()) {
        const vis = !this.tomUI.hintBtn.classList.contains('hidden');
        this.tomUI.setHintButtonVisible(!vis);
        if (!vis) this.tomUI.showMessage("Click the button for a spicy hint! 🌶️", 2500);
      }
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.sceneMgr.render();
  }
}

// ═══════════════════════════════════════════════════════════════════
// Error Boundary
// ═══════════════════════════════════════════════════════════════════
window.addEventListener('error', (event) => {
  console.error('Error:', event.error || event.message);
  const el = document.getElementById('app');
  if (el && !document.getElementById('error-overlay')) {
    const ov = document.createElement('div');
    ov.id = 'error-overlay';
    ov.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#090c10;color:#f8fafc;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;font-family:sans-serif;text-align:center';
    ov.innerHTML = '<div style="font-size:48px;margin-bottom:16px">⚠️</div><h2 style="color:#f59e0b;margin-bottom:8px">Something went wrong</h2><p style="color:#94a3b8;margin-bottom:20px;max-width:400px">The app will reload automatically.</p><button onclick="location.reload()" style="background:#06b6d4;color:white;border:none;padding:12px 32px;border-radius:12px;font-size:16px;cursor:pointer">Reload App</button><p style="color:#64748b;font-size:11px;margin-top:16px">' + (event.message || 'Unknown error') + '</p>';
    el.appendChild(ov);
  }
  event.preventDefault();
});

// ═══════════════════════════════════════════════════════════════════
// Service Worker
// ═══════════════════════════════════════════════════════════════════
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// ═══════════════════════════════════════════════════════════════════
// Game State Persistence
// ═══════════════════════════════════════════════════════════════════
window.GameSave = {
  save(state) {
    try { localStorage.setItem('knight3d_save', JSON.stringify({ ...state, ts: Date.now() })); } catch(e) {}
  },
  load() {
    try {
      const d = JSON.parse(localStorage.getItem('knight3d_save'));
      return d && Date.now() - d.ts < 3600000 ? d : null;
    } catch(e) { return null; }
  },
  clear() { localStorage.removeItem('knight3d_save'); }
};

// ═══════════════════════════════════════════════════════════════════
// Android Back Button
// ═══════════════════════════════════════════════════════════════════
document.addEventListener('backbutton', (e) => {
  e.preventDefault();
  const a = window.app;
  if (!a) return;
  if (!a.ui.gameOverModal.classList.contains('hidden')) { a.ui.gameOverModal.classList.add('hidden'); return; }
  if (!a.ui.promotionModal.classList.contains('hidden')) { a.ui.promotionModal.classList.add('hidden'); return; }
  if (!a.ui.privacyModal.classList.contains('hidden')) { a.ui.privacyModal.classList.add('hidden'); return; }
  if (!a.ui.mainMenu.classList.contains('active')) { a.ui.showMainMenu(); return; }
  if (window._exitTimer) {
    clearTimeout(window._exitTimer);
    window._exitTimer = null;
    if (navigator.app && navigator.app.exitApp) navigator.app.exitApp();
  } else {
    window._exitTimer = setTimeout(() => { window._exitTimer = null; }, 2000);
    const t = document.createElement('div');
    t.className = 'exit-toast glass-pill';
    t.textContent = 'Press back again to exit';
    document.getElementById('app').appendChild(t);
    setTimeout(() => { if (t.parentNode) t.parentNode.removeChild(t); }, 2000);
  }
}, false);

// ═══════════════════════════════════════════════════════════════════
// Privacy Policy Modal
// ═══════════════════════════════════════════════════════════════════
setTimeout(() => {
  const bp = document.getElementById('btn-privacy-policy');
  const pm = document.getElementById('privacy-modal');
  const bc = document.getElementById('btn-privacy-close');
  if (bp && pm && bc) {
    bp.addEventListener('click', () => pm.classList.remove('hidden'));
    bc.addEventListener('click', () => pm.classList.add('hidden'));
    pm.addEventListener('click', (e) => { if (e.target === pm) pm.classList.add('hidden'); });
  }
}, 100);

// ═══════════════════════════════════════════════════════════════════
// Instantiate App
// ═══════════════════════════════════════════════════════════════════
window.addEventListener('DOMContentLoaded', () => {
  window.app = new GameApp();
});
