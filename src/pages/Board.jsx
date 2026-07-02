import { useGame } from '../hooks/useGame';
import Cell from '../components/Cell';
import Scoreboard from '../components/Scoreboard';
import styles from '../styles/Board.module.css';

const STATUS_LABELS = {
  lobby: 'Waiting for players...',
  selecting: 'Select a question',
  question: 'Question revealed — buzz in!',
  buzzing: 'Someone buzzed in!',
  judging: 'Judging answer...',
};

export default function Board() {
  const game = useGame();

  if (!game) {
    return <div className={styles.loading}>Loading game...</div>;
  }

  const { status, categories, players, currentQuestion, buzzer } = game;

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.title}>Quiz Night</h1>
        <p className={styles.status}>{STATUS_LABELS[status] ?? status}</p>
      </header>

      {status === 'lobby' && (
        <div className={styles.lobby}>
          <p>Share <strong>/join</strong> with your players</p>
          <Scoreboard players={players} />
        </div>
      )}

      {(status === 'selecting' || !currentQuestion) && categories && (
        <div className={styles.board}>
          {categories.map((cat, ci) => (
            <div key={ci} className={styles.column}>
              <div className={styles.categoryHeader}>{cat.name}</div>
              {cat.questions.map((q, qi) => (
                <Cell
                  key={qi}
                  value={q.value}
                  used={q.used}
                  active={false}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {currentQuestion && status !== 'selecting' && (
        <div className={`${styles.questionCard} ${currentQuestion.imageUrl ? styles.questionCardWithImage : ''}`}>
          {currentQuestion.imageUrl && (
            <img className={styles.questionImage} src={currentQuestion.imageUrl} alt="" />
          )}
          <div className={styles.questionFooter}>
            <p className={styles.questionText}>{currentQuestion.text}</p>
            {(status === 'judging' || status === 'revealed') && (
              <p className={styles.answer}>Answer: {currentQuestion.answer}</p>
            )}
          </div>
        </div>
      )}

      {buzzer && (status === 'buzzing' || status === 'judging') && (
        <div className={styles.buzzerBanner}>
          <span>{buzzer.playerName} buzzed in!</span>
        </div>
      )}

      <Scoreboard players={players} />
    </div>
  );
}
