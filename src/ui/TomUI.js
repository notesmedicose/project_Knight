/**
 * TomUI — Talking Tom's visual presence in the game.
 * Renders Tom's avatar, speech bubble, and hint button as floating DOM elements.
 * Animates smoothly with CSS transitions.
 */
export class TomUI {
  constructor() {
    this.container = null;
    this.avatar = null;
    this.speechBubble = null;
    this.speechText = null;
    this.hintBtn = null;
    this.visible = false;
    this.messageTimeout = null;
    this.buildDOM();
  }

  buildDOM() {
    // Main container
    this.container = document.createElement('div');
    this.container.id = 'tom-container';
    this.container.className = 'tom-container';

    // Speech bubble (hidden by default)
    this.speechBubble = document.createElement('div');
    this.speechBubble.id = 'tom-speech';
    this.speechBubble.className = 'tom-speech glass-pill hidden';

    this.speechText = document.createElement('p');
    this.speechText.id = 'tom-text';

    this.speechBubble.appendChild(this.speechText);
    this.container.appendChild(this.speechBubble);

    // Avatar
    this.avatar = document.createElement('div');
    this.avatar.id = 'tom-avatar';
    this.avatar.className = 'tom-avatar';
    this.avatar.textContent = '🗣️';

    // Tooltip label
    this.avatarLabel = document.createElement('span');
    this.avatarLabel.className = 'tom-avatar-label';
    this.avatarLabel.textContent = 'Tom';

    this.container.appendChild(this.avatar);
    this.container.appendChild(this.avatarLabel);

    // Hint button (hidden by default)
    this.hintBtn = document.createElement('button');
    this.hintBtn.id = 'btn-tom-hint';
    this.hintBtn.className = 'tom-hint-btn glass-pill hidden';
    this.hintBtn.textContent = '💡 Ask Tom';

    this.container.appendChild(this.hintBtn);

    // Append to app
    const app = document.getElementById('app');
    if (app) {
      app.appendChild(this.container);
    }

    // Bind avatar click for friend mode hint offer
    this.avatar.addEventListener('click', () => {
      if (this.visible && this.speechBubble.classList.contains('hidden')) {
        // Clicking on Tom when no message shown — trigger hint offer in friend mode
        this.container.dispatchEvent(new CustomEvent('tom-click'));
      } else {
        this.hideSpeech();
      }
    });
  }

  /**
   * Show a temporary message in Tom's speech bubble
   */
  showMessage(text, duration = 4000) {
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
    }

    this.speechText.textContent = text;
    this.speechBubble.classList.remove('hidden');
    this.visible = true;
    this.avatar.classList.add('tom-talking');

    // Animate in
    this.speechBubble.style.animation = 'none';
    requestAnimationFrame(() => {
      this.speechBubble.style.animation = 'bubbleIn 0.3s ease forwards';
    });

    // Auto-hide after duration
    this.messageTimeout = setTimeout(() => {
      this.hideSpeech();
    }, duration);
  }

  /**
   * Show a persistent hint message until dismissed or replaced
   */
  showHint(text) {
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
    }

    this.speechText.textContent = text;
    this.speechBubble.classList.remove('hidden');
    this.visible = true;

    // Add hint styling
    this.speechBubble.classList.add('tom-hint-mode');
    this.speechBubble.style.animation = 'none';
    requestAnimationFrame(() => {
      this.speechBubble.style.animation = 'bubblePop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards';
    });
  }

  /**
   * Hide speech bubble
   */
  hideSpeech() {
    this.speechBubble.classList.add('hidden');
    this.speechBubble.classList.remove('tom-hint-mode');
    this.avatar.classList.remove('tom-talking');
    this.visible = false;
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
      this.messageTimeout = null;
    }
  }

  /**
   * Show/hide the hint button
   */
  setHintButtonVisible(visible) {
    if (visible) {
      this.hintBtn.classList.remove('hidden');
    } else {
      this.hintBtn.classList.add('hidden');
    }
  }

  /**
   * Set hint button text
   */
  setHintButtonText(text) {
    this.hintBtn.textContent = text;
  }

  /**
   * Bind hint button click handler
   */
  onHintClick(handler) {
    this.hintBtn.addEventListener('click', handler);
  }

  /**
   * Bind avatar click handler
   */
  onAvatarClick(handler) {
    this.container.addEventListener('tom-click', handler);
  }

  /**
   * Toggle Tom avatar animation (bounce when excited)
   */
  bounce() {
    this.avatar.classList.remove('tom-bounce');
    requestAnimationFrame(() => {
      this.avatar.classList.add('tom-bounce');
      setTimeout(() => this.avatar.classList.remove('tom-bounce'), 600);
    });
  }

  /**
   * Set game mode visual (adjust Tom's expression)
   */
  setGameModeVisual(mode) {
    this.avatar.textContent = mode === 'bot' ? '🗣️' : '😎';
    this.avatarLabel.textContent = mode === 'bot' ? 'Tom Coach' : 'Tom (Silent)';
    if (mode === 'friend') {
      this.setHintButtonText('🤫 Ask Tom');
    } else {
      this.setHintButtonText('💡 Ask Tom');
    }
  }

  /**
   * Clean up
   */
  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
