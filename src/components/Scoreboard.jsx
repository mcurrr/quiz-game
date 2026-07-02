import styles from '../styles/Scoreboard.module.css';

export default function Scoreboard({ players }) {
  if (!players) return null;
  const sorted = Object.entries(players).sort(([, a], [, b]) => b.score - a.score);
  return (
    <div className={styles.scoreboard}>
      {sorted.map(([id, p]) => (
        <div key={id} className={styles.player}>
          <span className={styles.name}>{p.name}</span>
          <span className={styles.score}>${p.score}</span>
        </div>
      ))}
    </div>
  );
}
