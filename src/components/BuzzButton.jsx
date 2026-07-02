import styles from '../styles/BuzzButton.module.css';

export default function BuzzButton({ onBuzz, disabled, buzzed }) {
  return (
    <button
      className={`${styles.buzz} ${buzzed ? styles.buzzed : ''} ${disabled ? styles.disabled : ''}`}
      onClick={onBuzz}
      disabled={disabled}
    >
      {buzzed ? 'BUZZED!' : 'BUZZ'}
    </button>
  );
}
