import { Chess } from 'chess.js';

/**
 * TalkingTom — The Knight's charismatic chess mascot!
 * Motivates players with slang, suggests brilliant moves, and keeps the vibes high.
 * In friend mode, Tom stays quiet unless asked for a hint.
 */
export class TalkingTom {
  constructor(gameMode = 'bot') {
    this.gameMode = gameMode;
    this.lastMoveQuality = 'SOLID';
    this.lastContext = '';
    this.moveCount = 0;
    this.greatMoveStreak = 0;
    this.isFirstGameMessage = true;

    // ─── Slang vocabulary categorized by context ───
    this.phrases = {
      FIRE: [
        'BRUH that move was absolutely FIRE! 🔥',
        'No cap, you\'re BUILT different! 🏆',
        'Yo, that was CLEAN fam! 🧼',
        'You just cooked \'em! Chef\'s kiss! 👨‍🍳💋',
        'Okay I see you! That\'s MAIN CHARACTER energy! ⚡',
        'ATE and LEFT no crumbs! 🍽️💅',
        'That move was DEE-LUXE! Straight VIP! 🌟',
        'Bruh you\'re literally HIM! 👑'
      ],
      SOLID: [
        'Ayy, solid vibes on that one! 💪',
        'You got the sauce, my dude! 🍝',
        'Good stuff — keep cooking! 🧑‍🍳',
        'That\'s a W in my book! 📖✅',
        'Smooth operator right there! 🎯',
        'Cleaner than my Sunday fit! 😎',
        'You\'re stacking Ws like pancakes! 🥞',
        'Respect — that was calculated! 🧮'
      ],
      MEH: [
        'Mid but okay... I\'ve seen worse 😅',
        'Cool cool... trust the process? 🤷',
        'It\'s a move... I guess? 🤨',
        'That was... something? 🤔',
        'Hey, you do you fam! ✌️',
        'Not your best werk but we ride! 🎢',
        'That\'s giving average tbh 📊',
        'I mean... it\'s legal! ✅'
      ],
      SUS: [
        'Uhh... you sure about that one? 🔍',
        'Bruh that\'s kinda sus ngl 📉',
        'My guy... that was a CHOICE 🧐',
        'We\'re not gonna talk about that move? 👀',
        'Homie what is you DOIN?! 🚨',
        'That\'s a bold strategy Cotton 😬',
        'Respectfully... that was trash 💀',
        'AI is EATING that mistake up! 🍽️'
      ],
      CAPTURE: [
        'SNATCHED! Yoink that piece! 🍪',
        'Get that snack fam! 🍴',
        'NOM NOM that piece tasted good! 😋',
        'Yoink and destroy! 🏴‍☠️',
        'You just mugged \'em! 🦹',
        'Free piece? Don\'t mind if I do! 🆓',
        'That piece got GHOSTED! 👻',
        'Ate that up like late-night tacos! 🌮'
      ],
      CHECK: [
        'They in danger! No cap! 🚨',
        'Locked \'em up! 🔐',
        'Pressure? You ARE the pressure! 😤',
        'King said "I\'m in danger" 😂',
        'You got \'em on the ropes! 🥊',
        'Tick tock — King\'s on the clock! ⏰',
        'Call an ambulance — not for you! 🚑',
        'Royalty in distress! 👑💦'
      ],
      CHECKMATE: [
        'YOU ABSOLUTELY ATE THAT! NO CRUMBS LEFT! 🏆🔥',
        'GG EZ NO RE MATCH! 💀🏆',
        'They got absolutely DESTROYED! 🔨',
        'That was a MASTERPIECE fam! 🎨👑',
        'You sent \'em to the shadow realm! 🌑',
        'BOOM! Checkmate with exclamation marks! ❗❗',
        'You didn\'t just win — you STUNTED! 🕺💅',
        'They logged off after that one 💻🚫'
      ],
      GAMEOVER_LOSS: [
        'Tough break king. We go again? 👑',
        'They clapped you ngl 💀',
        'That\'s a RIP moment... reload? 🔄',
        'You got cooked but it happens! 🍳',
        'Every chess legend took Ls too! 📜',
        'That\'s just character development 📖',
        'We don\'t lose we just run out of time! ⏳',
        'Shake it off champ! 🧘'
      ],
      GAMEOVER_DRAW: [
        'A draw? That\'s like sharing the last slice. Mid. 🍕',
        'Nobody won... nobody lost... we all chessed! ♟️',
        'Like a hug at the end of a fight 🤗',
        'A draw is a participation trophy 🏅'
      ],
      HINT_BOT: [
        'Bet. Slide that {piece} to {square}, watch what happens 😏',
        'Ayo — {piece} to {square}, trust! 🤝',
        'Easy money: {piece} → {square}. You\'re welcome! 🤑',
        '{piece} at {square}. Don\'t sleep! 🛑',
        'Certified banger: {piece} to {square} 🔥',
        'I got the sauce: {piece} ➡️ {square} 👨‍🍳',
        'Off the record? {piece} to {square}. No cap. 🤫',
        'Plot twist: hit \'em with {piece} to {square} 🎬'
      ],
      HINT_FRIEND: [
        'Aight fam between us... hit \'em with {piece} to {square} 🤫',
        'Yo psst! {piece} to {square} — don\'t tell! 🤐',
        'Lowkey? {piece} on {square} gonna hit different 💅',
        'Slide the {piece} to {square}, thank me later 😉',
        'Between you and me... {piece} {square}. That\'s the move! 🤭',
        '{piece} at {square} would go crazy rn 🚀'
      ],
      WELCOME_BOT: [
        'Yo! Tom in the building! Let\'s get this bread! 🍞',
        'Game time no cap! Tom\'s got your back! 🎮',
        'Ayy what\'s good! Let\'s clap this AI! 🤖💥',
        'Tom\'s watching — make it CLEAN fam! 👀'
      ],
      WELCOME_FRIEND: [
        'Ayy two players! Tom\'s just vibing 🎵',
        'Friend mode activated! I\'m here for the drama 🍿',
        'Pass and play let\'s gooo! Tom\'s the referee! 🧑‍⚖️',
        'Y\'all both gonna cook? Or burn? Let\'s find out! 🔥'
      ],
      FRIEND_HINT_OFFER: [
        'Need a little something? Ask me! 💡',
        'Stuck? Click me for the cheat code! 🎮',
        'Tom knows best... click for a spicy suggestion 🌶️'
      ]
    };
  }

  // ─── Public API ───

  setGameMode(mode) {
    this.gameMode = mode;
    this.moveCount = 0;
    this.greatMoveStreak = 0;
    this.isFirstGameMessage = true;
  }

  evaluateMove(chessInstance, from, to, promotion = 'q') {
    if (this.gameMode !== 'bot') return { quality: 'SOLID', score: 0, isGreat: false };
    this.moveCount++;
    const gameCopy = new Chess(chessInstance.fen());
    const userMove = gameCopy.move({ from, to, promotion });
    if (!userMove) return { quality: 'MEH', score: 0, isGreat: false };
    const userPosScore = this.quickEvaluate(gameCopy);
    const putInCheck = gameCopy.inCheck();
    const putInCheckmate = gameCopy.isCheckmate();
    gameCopy.undo();
    const beforeScore = this.quickEvaluate(gameCopy);
    const moves = gameCopy.moves({ verbose: true });
    let bestMoveScore = -Infinity;
    for (const move of moves) {
      gameCopy.move(move.san);
      const score = this.quickEvaluate(gameCopy);
      if (score > bestMoveScore) bestMoveScore = score;
      gameCopy.undo();
    }
    const actualGain = -(userPosScore) - beforeScore;
    let quality = 'MEH';
    if (putInCheckmate) quality = 'FIRE';
    else if (putInCheck && userMove.captured) quality = 'FIRE';
    else if (actualGain > 100) quality = 'FIRE';
    else if (actualGain > 30) quality = 'SOLID';
    else if (actualGain > -30) quality = 'MEH';
    else quality = 'SUS';
    if (userMove.captured && quality === 'MEH') quality = 'SOLID';
    const isGreat = quality === 'FIRE';
    if (isGreat) this.greatMoveStreak++;
    else this.greatMoveStreak = 0;
    this.lastMoveQuality = quality;
    return { quality, score: actualGain, isGreat };
  }

  getMotivationalMessage(context, quality) {
    let pool = [];
    switch (context) {
      case 'move':           pool = this.phrases[quality] || this.phrases.MEH; break;
      case 'capture':        pool = this.phrases.CAPTURE; break;
      case 'check':          pool = this.phrases.CHECK; break;
      case 'checkmate':      pool = this.phrases.CHECKMATE; break;
      case 'gameover_loss':  pool = this.phrases.GAMEOVER_LOSS; break;
      case 'gameover_draw':  pool = this.phrases.GAMEOVER_DRAW; break;
      case 'welcome_bot':    pool = this.phrases.WELCOME_BOT; break;
      case 'welcome_friend': pool = this.phrases.WELCOME_FRIEND; break;
      case 'friend_hint_offer': pool = this.phrases.FRIEND_HINT_OFFER; break;
      default:               pool = this.phrases.SOLID;
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  async getBestMoveHint(chessInstance, botAI) {
    const bestMove = await botAI.calculateBestMove(chessInstance);
    if (!bestMove) return "No moves left fam — game's over! 🎬";
    const pieceName = this.getSlangPieceName(bestMove.piece || 'p');
    const targetSquare = bestMove.to;
    const hints = this.gameMode === 'bot' ? this.phrases.HINT_BOT : this.phrases.HINT_FRIEND;
    const hint = hints[Math.floor(Math.random() * hints.length)];
    return hint.replace('{piece}', pieceName).replace('{square}', targetSquare);
  }

  getWelcomeMessage() {
    return this.gameMode === 'bot'
      ? this.getMotivationalMessage('welcome_bot')
      : this.getMotivationalMessage('welcome_friend');
  }

  getFriendHintOffer() {
    return this.getMotivationalMessage('friend_hint_offer');
  }

  getSlangPieceName(pieceType) {
    const names = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
    return names[pieceType] || 'piece';
  }

  quickEvaluate(game) {
    const pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
    const board = game.board();
    let score = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece) {
          const val = pieceValues[piece.type] || 0;
          const centerBonus = (r >= 2 && r <= 5 && c >= 2 && c <= 5) ? 10 : 0;
          score += piece.color === 'w' ? (val + centerBonus) : -(val + centerBonus);
        }
      }
    }
    if (game.inCheck()) score += game.turn() === 'w' ? -50 : 50;
    return game.turn() === 'w' ? score : -score;
  }
}
