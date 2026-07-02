import { useNavigate } from 'react-router-dom';
import { ref, runTransaction } from 'firebase/database';
import { db } from '../firebase';
import { useGame } from '../hooks/useGame';
import BuzzButton from '../components/BuzzButton';
import styles from '../styles/Play.module.css';

export default function Play() {
  const navigate = useNavigate();
  const game = useGame();
  const playerId = localStorage.getItem('playerId');
  const playerName = localStorage.getItem('playerName');

  if (!playerName || !playerId) {
    navigate('/join');
    return null;
  }

  const player = game?.players?.[playerId];
  const buzzer = game?.buzzer;
  const status = game?.status;
  const currentQuestion = game?.currentQuestion;

  const iMyBuzz = buzzer?.playerId === playerId;
  const someoneElseBuzzed = buzzer && !iMyBuzz;
  const canBuzz = status === 'question' && !buzzer;

  async function handleBuzz() {
    if (!canBuzz) return;
    await runTransaction(ref(db, 'game/buzzer'), (current) => {
      if (current !== null) return; // abort — someone already buzzed
      return { playerId, playerName, timestamp: Date.now() };
    });
    await runTransaction(ref(db, 'game/status'), (current) => {
      if (current !== 'question') return;
      return 'buzzing';
    });
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <span className={styles.playerName}>{playerName}</span>
        <span className={styles.score}>${player?.score ?? 0}</span>
      </header>

      <main className={styles.main}>
        {status === 'lobby' && (
          <p className={styles.waiting}>Waiting for the game to start...</p>
        )}

        {status === 'selecting' && (
          <p className={styles.waiting}>Host is picking a question...</p>
        )}

        {status === 'question' && (
          <div className={styles.buzzArea}>
            <p className={styles.prompt}>Buzz in if you know the answer!</p>
            <BuzzButton onBuzz={handleBuzz} disabled={!canBuzz} buzzed={false} />
          </div>
        )}

        {status === 'buzzing' && iMyBuzz && (
          <div className={styles.buzzArea}>
            <p className={styles.youBuzzed}>You buzzed first! Give your answer!</p>
            <BuzzButton onBuzz={() => {}} disabled buzzed />
          </div>
        )}

        {status === 'buzzing' && someoneElseBuzzed && (
          <p className={styles.waiting}><strong>{buzzer.playerName}</strong> buzzed in first.</p>
        )}

        {status === 'judging' && iMyBuzz && (
          <p className={styles.waiting}>Admin is judging your answer...</p>
        )}

        {status === 'judging' && someoneElseBuzzed && (
          <p className={styles.waiting}><strong>{buzzer.playerName}</strong> is being judged...</p>
        )}

        {status === 'revealed' && currentQuestion && (
          <div className={styles.reveal}>
            <p className={styles.label}>Answer</p>
            <p className={styles.answerText}>{currentQuestion.answer}</p>
          </div>
        )}
      </main>
    </div>
  );
}
