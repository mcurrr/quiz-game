import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, update } from 'firebase/database';
import { db } from '../firebase';
import styles from '../styles/Join.module.css';

function getOrCreatePlayerId() {
  let id = localStorage.getItem('playerId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('playerId', id);
  }
  return id;
}

export default function Join() {
  const [name, setName] = useState('');
  const [joining, setJoining] = useState(false);
  const navigate = useNavigate();

  const existingName = localStorage.getItem('playerName');

  async function handleJoin(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setJoining(true);
    const id = getOrCreatePlayerId();
    localStorage.setItem('playerName', trimmed);
    await update(ref(db, `game/players/${id}`), { name: trimmed, score: 0 });
    navigate('/play');
  }

  function handleRejoin() {
    navigate('/play');
  }

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>Join the Game</h1>

      {existingName && (
        <div className={styles.returning}>
          <p>Welcome back, <strong>{existingName}</strong>!</p>
          <button className={styles.btnPrimary} onClick={handleRejoin}>Rejoin as {existingName}</button>
          <p className={styles.or}>— or join with a new name —</p>
        </div>
      )}

      <form className={styles.form} onSubmit={handleJoin}>
        <input
          className={styles.input}
          type="text"
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={20}
          autoFocus
          required
        />
        <button className={styles.btnPrimary} type="submit" disabled={joining || !name.trim()}>
          {joining ? 'Joining...' : 'Join'}
        </button>
      </form>
    </div>
  );
}
