import { Chess } from 'chess.js';

/**
 * Offline Minimax AI Engine with Alpha-Beta Pruning and Piece-Square Tables
 */
export class BotAI {
  constructor(difficulty = 'medium') {
    this.difficulty = difficulty;

    // Standard piece values in centipawns
    this.pieceValues = {
      p: 100,
      n: 320,
      b: 330,
      r: 500,
      q: 900,
      k: 20000
    };

    // Positional evaluation tables (PST) for White perspective
    this.pawnTable = [
      [0,  0,  0,  0,  0,  0,  0,  0],
      [50, 50, 50, 50, 50, 50, 50, 50],
      [10, 10, 20, 30, 30, 20, 10, 10],
      [ 5,  5, 10, 25, 25, 10,  5,  5],
      [ 0,  0,  0, 20, 20,  0,  0,  0],
      [ 5, -5,-10,  0,  0,-10, -5,  5],
      [ 5, 10, 10,-20,-20, 10, 10,  5],
      [ 0,  0,  0,  0,  0,  0,  0,  0]
    ];

    this.knightTable = [
      [-50,-40,-30,-30,-30,-30,-40,-50],
      [-40,-20,  0,  0,  0,  0,-20,-40],
      [-30,  0, 10, 15, 15, 10,  0,-30],
      [-30,  5, 15, 20, 20, 15,  5,-30],
      [-30,  0, 15, 20, 20, 15,  0,-30],
      [-30,  5, 10, 15, 15, 10,  5,-30],
      [-40,-20,  0,  5,  5,  0,-20,-40],
      [-50,-40,-30,-30,-30,-30,-40,-50]
    ];
  }

  setDifficulty(diff) {
    this.difficulty = diff;
  }

  /**
   * Main entry point to calculate the best move asynchronously
   */
  async calculateBestMove(chessInstance) {
    const chessCopy = new Chess(chessInstance.fen());
    const moves = chessCopy.moves({ verbose: true });
    
    if (moves.length === 0) return null;

    if (this.difficulty === 'easy') {
      // 70% random, 30% shallow search
      if (Math.random() < 0.7) {
        return moves[Math.floor(Math.random() * moves.length)];
      }
    }

    const maxDepth = this.difficulty === 'hard' ? 3 : (this.difficulty === 'medium' ? 2 : 1);
    
    // Asynchronous wrapper to allow UI frame ticks
    return new Promise(resolve => {
      setTimeout(() => {
        let bestMove = null;
        let bestValue = -Infinity;
        const alpha = -Infinity;
        const beta = Infinity;

        // Shuffle moves slightly for non-deterministic variety
        moves.sort(() => Math.random() - 0.5);

        for (const move of moves) {
          chessCopy.move(move);
          const boardVal = -this.minimax(chessCopy, maxDepth - 1, -beta, -alpha, false);
          chessCopy.undo();

          if (boardVal > bestValue) {
            bestValue = boardVal;
            bestMove = move;
          }
        }
        resolve(bestMove || moves[0]);
      }, 50);
    });
  }

  minimax(game, depth, alpha, beta, isMaximizing) {
    if (depth === 0 || game.isGameOver()) {
      return this.evaluateBoard(game);
    }

    const moves = game.moves({ verbose: true });
    let maxEval = -Infinity;

    for (const move of moves) {
      game.move(move);
      const evalVal = -this.minimax(game, depth - 1, -beta, -alpha, !isMaximizing);
      game.undo();

      maxEval = Math.max(maxEval, evalVal);
      alpha = Math.max(alpha, evalVal);
      if (alpha >= beta) {
        break; // Alpha-beta pruning
      }
    }
    return maxEval;
  }

  evaluateBoard(game) {
    let totalEvaluation = 0;
    const board = game.board();

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece) {
          const val = this.getPieceValue(piece, r, c);
          totalEvaluation += piece.color === 'w' ? val : -val;
        }
      }
    }

    return game.turn() === 'w' ? totalEvaluation : -totalEvaluation;
  }

  getPieceValue(piece, rank, col) {
    const baseVal = this.pieceValues[piece.type] || 0;
    let pstVal = 0;

    const r = piece.color === 'w' ? rank : 7 - rank;
    if (piece.type === 'p') {
      pstVal = this.pawnTable[r][col];
    } else if (piece.type === 'n') {
      pstVal = this.knightTable[r][col];
    }

    return baseVal + pstVal;
  }
}
