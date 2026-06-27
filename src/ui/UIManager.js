export class UIManager {
  constructor() {
    this.bindDOM();
  }

  bindDOM() {
    // Overlays & Panels
    this.mainMenu = document.getElementById('main-menu');
    this.gameHud = document.getElementById('game-hud');
    this.botDifficultySelector = document.getElementById('bot-difficulty-selector');
    this.promotionModal = document.getElementById('promotion-modal');
    this.gameOverModal = document.getElementById('game-over-modal');

    // Main Buttons
    this.btnModeBot = document.getElementById('btn-mode-bot');
    this.btnModeFriend = document.getElementById('btn-mode-friend');
    this.btnStartBotGame = document.getElementById('btn-start-bot-game');

    // HUD Elements
    this.turnIndicator = document.getElementById('turn-indicator');
    this.gameStateMessage = document.getElementById('game-state-message');
    this.nameWhite = document.getElementById('name-white');
    this.nameBlack = document.getElementById('name-black');
    this.capturedWhite = document.getElementById('captured-by-white');
    this.capturedBlack = document.getElementById('captured-by-black');

    // Quick Actions
    this.btnHudMenu = document.getElementById('btn-hud-menu');
    this.btnHudUndo = document.getElementById('btn-hud-undo');
    this.btnHudReset = document.getElementById('btn-hud-reset');
    this.btnHudCamera = document.getElementById('btn-hud-camera');
    this.btnHudSound = document.getElementById('btn-hud-sound');

    // Modals
    this.gameOverTitle = document.getElementById('game-over-title');
    this.gameOverResult = document.getElementById('game-over-result');
    this.btnRestartGame = document.getElementById('btn-restart-game');
    this.btnReturnMenu = document.getElementById('btn-return-menu');

    this.selectedDifficulty = 'medium';
    this.setupDifficultyButtons();
  }

  setupDifficultyButtons() {
    const diffBtns = document.querySelectorAll('.btn-diff');
    diffBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        diffBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedDifficulty = btn.getAttribute('data-diff');
      });
    });
  }

  showMainMenu() {
    this.mainMenu.classList.add('active');
    this.gameHud.classList.add('hidden');
    this.gameOverModal.classList.add('hidden');
    this.promotionModal.classList.add('hidden');
  }

  showGameHUD(mode) {
    this.mainMenu.classList.remove('active');
    this.gameHud.classList.remove('hidden');
    this.botDifficultySelector.classList.add('hidden');
    this.gameOverModal.classList.add('hidden');
    this.promotionModal.classList.add('hidden');

    if (mode === 'bot') {
      this.nameWhite.textContent = 'White (You)';
      this.nameBlack.textContent = `Black (Bot: ${this.selectedDifficulty.toUpperCase()})`;
    } else {
      this.nameWhite.textContent = 'White (Player 1)';
      this.nameBlack.textContent = 'Black (Player 2)';
    }
  }

  updateTurn(turnColor, inCheck = false) {
    if (turnColor === 'w') {
      this.turnIndicator.textContent = "White's Turn";
      this.turnIndicator.className = 'turn-badge white-turn';
    } else {
      this.turnIndicator.textContent = "Black's Turn";
      this.turnIndicator.className = 'turn-badge black-turn';
    }

    if (inCheck) {
      this.gameStateMessage.textContent = '⚠️ CHECK!';
    } else {
      this.gameStateMessage.textContent = '';
    }
  }

  updateCapturedPieces(history) {
    const pieceSymbols = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛' };
    let capturedByW = '';
    let capturedByB = '';

    history.forEach(move => {
      if (move.captured) {
        const sym = pieceSymbols[move.captured] || '';
        if (move.color === 'w') {
          capturedByW += sym;
        } else {
          capturedByB += sym;
        }
      }
    });

    this.capturedWhite.textContent = capturedByW;
    this.capturedBlack.textContent = capturedByB;
  }

  showPromotionModal(callback) {
    this.promotionModal.classList.remove('hidden');
    const promoBtns = document.querySelectorAll('.promo-btn');

    const handler = (e) => {
      const piece = e.target.getAttribute('data-piece');
      this.promotionModal.classList.add('hidden');
      promoBtns.forEach(b => b.removeEventListener('click', handler));
      if (callback) callback(piece);
    };

    promoBtns.forEach(b => b.addEventListener('click', handler));
  }

  showGameOver(title, result) {
    this.gameOverTitle.textContent = title;
    this.gameOverResult.textContent = result;
    this.gameOverModal.classList.remove('hidden');
  }
}
