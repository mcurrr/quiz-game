import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';

export function useGame() {
  const [game, setGame] = useState(null);

  useEffect(() => {
    const gameRef = ref(db, 'game');
    const unsub = onValue(gameRef, (snap) => {
      setGame(snap.val());
    });
    return unsub;
  }, []);

  return game;
}
