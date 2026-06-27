import * as THREE from 'three';
import { SceneManager } from './gfx/SceneManager.js';
import { ChessBoard3D } from './gfx/ChessBoard3D.js';
import { ProceduralTextureGenerator } from './gfx/ProceduralTextureGenerator.js';
import { ChessEngine } from './logic/ChessEngine.js';
import { BotAI } from './logic/BotAI.js';
import { SoundManager } from './audio/SoundManager.js';
import { UIManager } from './ui/UIManager.js';
import { AdManager } from './ads/AdManager.js';

class GameApp {
  constructor() {
    this.gameMode = 'bot'; // 'bot' or 'friend'
    this.isAnimating = false;

    // Subsystems
    this.sceneMgr = new SceneManager('canvas-container');
    this.board3D = new ChessBoard3D(this.sceneMgr.scene);
    this.engine = new ChessEngine();
    this.bot = new BotAI('medium');
    this.sound = new SoundManager();
    this.ui = new UIManager();
    this.ads = new AdManager();

    this.init();
  }

  async init() {
    // Generate procedural textures
    this._initTextures();

    // Sync initial board
    this.board3D.syncBoardState(this.engine.getBoard());

    // Setup Event Handlers
    this.setupUIEvents();
    this.setupInputEvents();

    // Start render loop
    this.animate();

    // Init Ads
    await this.ads.initialize();
  }

  /**
   * Initialize all procedural textures for the scene
   */
  _initTextures() {
    // Get the adaptive resolution from board3D
    const resolution = this.board3D.textureResolution;
    const texGen = new ProceduralTextureGenerator(resolution);

    // Store reference to renderer for texture regeneration
    this.board3D.renderer = this.sceneMgr.renderer;

    // Generate all textures at once
    const textures = texGen.generateAllTextures(this.sceneMgr.renderer);

    // Apply textures to the board (tiles, frame, brass inlay)
    this.board3D.textures = textures;
    this.board3D._applyTexturesToBoard();

    // Apply textures to piece materials
    this.board3D.pieceGenerator.setTextures(textures);

    // Set environment map for reflections on the scene
    this.sceneMgr.scene.environment = textures.envMap;
  }

  setupUIEvents() {
    // Menu Mode buttons
    this.ui.btnModeBot.addEventListener('click', () => {
      this.ui.botDifficultySelector.classList.remove('hidden');
    });

    this.ui.btnModeFriend.addEventListener('click', () => {
      this.startNewGame('friend');
    });

    this.ui.btnStartBotGame.addEventListener('click', () => {
      this.bot.setDifficulty(this.ui.selectedDifficulty);
      this.startNewGame('bot');
    });

    // HUD Actions
    this.ui.btnHudMenu.addEventListener('click', () => {
      this.ui.showMainMenu();
    });

    this.ui.btnHudReset.addEventListener('click', () => {
      this.startNewGame(this.gameMode);
    });

    this.ui.btnHudUndo.addEventListener('click', () => {
      if (this.isAnimating) return;
      this.engine.undo();
      if (this.gameMode === 'bot') {
        this.engine.undo(); // undo bot move as well
      }
      this.board3D.setSelectedSquare(null);
      this.board3D.clearHighlights();
      this.board3D.syncBoardState(this.engine.getBoard());
      this.ui.updateTurn(this.engine.turn(), this.engine.inCheck());
      this.ui.updateCapturedPieces(this.engine.history());
    });

    this.ui.btnHudCamera.addEventListener('click', () => {
      const perspective = (this.gameMode === 'friend' && this.engine.turn() === 'b') ? 'b' : 'w';
      this.sceneMgr.resetCameraView(perspective);
    });

    this.ui.btnHudSound.addEventListener('click', () => {
      const enabled = this.sound.toggleSound();
      this.ui.btnHudSound.textContent = enabled ? '🔊' : '🔇';
    });

    // Modal Actions
    this.ui.btnRestartGame.addEventListener('click', () => {
      this.startNewGame(this.gameMode);
    });

    this.ui.btnReturnMenu.addEventListener('click', () => {
      this.ui.showMainMenu();
    });
  }

  setupInputEvents() {
    const dom = this.sceneMgr.renderer.domElement;
    
    const handlePointerDown = (event) => {
      if (this.isAnimating || this.engine.isGameOver()) return;

      // Disable input during bot turn
      if (this.gameMode === 'bot' && this.engine.turn() === 'b') return;

      const rect = dom.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      this.sceneMgr.mouse.set(x, y);
      this.sceneMgr.raycaster.setFromCamera(this.sceneMgr.mouse, this.sceneMgr.camera);

      // Check intersections with tiles or pieces
      const intersects = this.sceneMgr.raycaster.intersectObjects(this.sceneMgr.scene.children, true);

      let clickedSquare = null;
      for (const hit of intersects) {
        let obj = hit.object;
        while (obj && !obj.userData.square && !obj.userData.isTile) {
          obj = obj.parent;
        }
        if (obj && obj.userData.square) {
          clickedSquare = obj.userData.square;
          break;
        }
      }

      if (clickedSquare) {
        this.onSquareClicked(clickedSquare);
      }
    };

    dom.addEventListener('pointerdown', handlePointerDown);
  }

  onSquareClicked(square) {
    const pieceOnSquare = this.engine.game.get(square);
    const currentTurn = this.engine.turn();

    // Case 1: Clicking player's own piece -> Select it
    if (pieceOnSquare && pieceOnSquare.color === currentTurn) {
      this.board3D.setSelectedSquare(square);
      const validMoves = this.engine.getValidMoves(square);
      this.board3D.showMoveHighlights(validMoves);
      return;
    }

    // Case 2: Clicking a destination square with a selected piece
    if (this.board3D.selectedSquare) {
      const fromSq = this.board3D.selectedSquare;
      const validMoves = this.engine.getValidMoves(fromSq);

      if (validMoves.includes(square)) {
        // Check for Pawn promotion
        const movingPiece = this.engine.game.get(fromSq);
        const isPawnPromotion = movingPiece.type === 'p' && (square[1] === '8' || square[1] === '1');

        if (isPawnPromotion) {
          this.ui.showPromotionModal((promoType) => {
            this.executeMove(fromSq, square, promoType);
          });
        } else {
          this.executeMove(fromSq, square, 'q');
        }
      } else {
        // Deselect if clicking invalid square
        this.board3D.setSelectedSquare(null);
        this.board3D.clearHighlights();
      }
    }
  }

  executeMove(fromSq, toSq, promotion = 'q') {
    this.isAnimating = true;
    this.board3D.setSelectedSquare(null);
    this.board3D.clearHighlights();

    const isCapture = !!this.engine.game.get(toSq);
    const moveResult = this.engine.makeMove(fromSq, toSq, promotion);

    if (moveResult) {
      this.board3D.animateMove(fromSq, toSq, () => {
        this.isAnimating = false;
        
        // Sound effect
        if (isCapture) {
          this.sound.playCapture();
        } else {
          this.sound.playMove();
        }

        // Sync state for special moves (castling, en passant, promotion)
        this.board3D.syncBoardState(this.engine.getBoard());
        this.board3D.updateTurnLights(this.engine.turn());
        this.ui.updateTurn(this.engine.turn(), this.engine.inCheck());
        this.ui.updateCapturedPieces(this.engine.history());

        // Check for check audio/status
        if (this.engine.inCheck()) {
          this.sound.playCheck();
        }

        // Check Game Over
        if (this.checkGameOver()) return;

        // Trigger Bot turn if playing Bot
        if (this.gameMode === 'bot' && this.engine.turn() === 'b') {
          this.triggerBotMove();
        }
      });
    } else {
      this.isAnimating = false;
    }
  }

  async triggerBotMove() {
    this.isAnimating = true;
    const botMove = await this.bot.calculateBestMove(this.engine.game);
    this.isAnimating = false;

    if (botMove) {
      this.executeMove(botMove.from, botMove.to, botMove.promotion || 'q');
    }
  }

  checkGameOver() {
    if (this.engine.isGameOver()) {
      this.sound.playGameOver();
      if (this.engine.isCheckmate()) {
        const winner = this.engine.turn() === 'w' ? 'Black' : 'White';
        this.ui.showGameOver('CHECKMATE!', `${winner} Wins the Game!`);
      } else if (this.engine.isDraw()) {
        this.ui.showGameOver('DRAW!', 'The game ended in a draw.');
      }
      return true;
    }
    return false;
  }

  startNewGame(mode) {
    this.gameMode = mode;
    this.isAnimating = false;
    this.engine.reset();
    this.board3D.setSelectedSquare(null);
    this.board3D.clearHighlights();
    this.board3D.syncBoardState(this.engine.getBoard());
    this.board3D.updateTurnLights('w');
    this.sceneMgr.resetCameraView('w');
    this.ui.showGameHUD(mode);
    this.ui.updateTurn('w', false);
    this.ui.updateCapturedPieces([]);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.sceneMgr.render();
  }
}

// Instantiate App on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.app = new GameApp();
});
