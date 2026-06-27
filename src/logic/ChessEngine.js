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

  makeMove(from, to, promotion = 'q') {
    try {
      const move = this.game.move({ from, to, promotion });
      return move;
    } catch (e) {
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
