import { Chess } from 'chess.js';

export class ChessEngine {
  constructor() {
    this.game = new Chess();
  }

  reset() {
    this.game.reset();
  }

  getBoard() {
    return this.game.board();
  }

  turn() {
    return this.game.turn(); // 'w' or 'b'
  }

  isGameOver() {
    return this.game.isGameOver();
  }

  inCheck() {
    return this.game.inCheck();
  }

  isCheckmate() {
    return this.game.isCheckmate();
  }

  isDraw() {
    return this.game.isDraw();
  }

  isStalemate() {
    return this.game.isStalemate();
  }

  getValidMoves(square) {
    return this.game.moves({ square, verbose: true }).map(m => m.to);
  }

  makeMove(from, to, promotion = null) {
    try {
      const movePayload = { from, to };
      const piece = this.game.get(from);
      const isPromo = piece && piece.type === 'p' && (to[1] === '8' || to[1] === '1');
      if (isPromo) {
        movePayload.promotion = promotion || 'q';
      }
      return this.game.move(movePayload);
    } catch (e) {
      console.warn('makeMove error:', e.message);
      return null;
    }
  }

  undo() {
    return this.game.undo();
  }

  fen() {
    return this.game.fen();
  }

  history() {
    return this.game.history({ verbose: true });
  }
}
