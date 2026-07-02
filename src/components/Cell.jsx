import styles from '../styles/Cell.module.css';

export default function Cell({ value, used, active, onClick }) {
  return (
    <button
      className={`${styles.cell} ${used ? styles.used : ''} ${active ? styles.active : ''}`}
      onClick={!used ? onClick : undefined}
      disabled={used}
    >
      {used ? '' : `$${value}`}
    </button>
  );
}
