import { useState } from 'react';
import { ref, set, update, runTransaction } from 'firebase/database';
import { db } from '../firebase';
import { useGame } from '../hooks/useGame';
import styles from '../styles/Admin.module.css';

const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET;

const DEFAULT_CATEGORIES = [
  { name: 'Category 1', questions: [100, 200, 300, 400, 500].map(v => ({ value: v, text: '', answer: '', imageUrl: '', used: false })) },
  { name: 'Category 2', questions: [100, 200, 300, 400, 500].map(v => ({ value: v, text: '', answer: '', imageUrl: '', used: false })) },
  { name: 'Category 3', questions: [100, 200, 300, 400, 500].map(v => ({ value: v, text: '', answer: '', imageUrl: '', used: false })) },
  { name: 'Category 4', questions: [100, 200, 300, 400, 500].map(v => ({ value: v, text: '', answer: '', imageUrl: '', used: false })) },
  { name: 'Category 5', questions: [100, 200, 300, 400, 500].map(v => ({ value: v, text: '', answer: '', imageUrl: '', used: false })) },
];

export default function Admin() {
  const [secret, setSecret] = useState('');
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem('adminAuthed') === ADMIN_SECRET
  );
  const [tab, setTab] = useState('cms');
  const [draft, setDraft] = useState(DEFAULT_CATEGORIES);
  const game = useGame();

  function handleAuth(e) {
    e.preventDefault();
    if (secret === ADMIN_SECRET) {
      sessionStorage.setItem('adminAuthed', ADMIN_SECRET);
      setAuthed(true);
    } else {
      alert('Wrong secret');
    }
  }

  async function saveAndStart() {
    await set(ref(db, 'game'), {
      status: 'lobby',
      categories: draft,
      players: game?.players ?? {},
      currentQuestion: null,
      buzzer: null,
    });
    setTab('control');
  }

  async function resetGame() {
    if (!confirm('Reset the whole game? Player scores will be wiped.')) return;
    const existingPlayers = game?.players ?? {};
    const resetPlayers = Object.fromEntries(
      Object.entries(existingPlayers).map(([id, p]) => [id, { ...p, score: 0 }])
    );
    await set(ref(db, 'game'), {
      status: 'lobby',
      categories: draft,
      players: resetPlayers,
      currentQuestion: null,
      buzzer: null,
    });
  }

  async function openQuestion(catIdx, qIdx) {
    const q = game.categories[catIdx].questions[qIdx];
    await update(ref(db, 'game'), {
      status: 'question',
      currentQuestion: { catIdx, qIdx, text: q.text, answer: q.answer, value: q.value, imageUrl: q.imageUrl ?? '' },
      buzzer: null,
    });
  }

  async function clearBuzzer() {
    await update(ref(db, 'game'), { buzzer: null, status: 'question' });
  }

  async function judgeAnswer(correct) {
    const { buzzer, currentQuestion } = game;
    if (!buzzer || !currentQuestion) return;
    const scoreChange = correct ? currentQuestion.value : -currentQuestion.value;
    const updates = {};
    updates[`game/players/${buzzer.playerId}/score`] = (game.players?.[buzzer.playerId]?.score ?? 0) + scoreChange;
    if (correct) {
      updates[`game/categories/${currentQuestion.catIdx}/questions/${currentQuestion.qIdx}/used`] = true;
      updates['game/status'] = 'selecting';
      updates['game/currentQuestion'] = null;
      updates['game/buzzer'] = null;
    } else {
      updates['game/status'] = 'question';
      updates['game/buzzer'] = null;
    }
    await update(ref(db), updates);
  }

  async function revealAnswer() {
    await update(ref(db, 'game'), { status: 'revealed' });
  }

  async function closeQuestion() {
    if (!game?.currentQuestion) return;
    const { catIdx, qIdx } = game.currentQuestion;
    await update(ref(db), {
      'game/status': 'selecting',
      'game/currentQuestion': null,
      'game/buzzer': null,
      [`game/categories/${catIdx}/questions/${qIdx}/used`]: true,
    });
  }

  function updateCategoryName(ci, name) {
    setDraft(d => d.map((c, i) => i === ci ? { ...c, name } : c));
  }

  function updateQuestion(ci, qi, field, value) {
    setDraft(d => d.map((c, i) => i !== ci ? c : {
      ...c,
      questions: c.questions.map((q, j) => j !== qi ? q : { ...q, [field]: value }),
    }));
  }

  function addCategory() {
    setDraft(d => [...d, { name: `Category ${d.length + 1}`, questions: [100, 200, 300, 400, 500].map(v => ({ value: v, text: '', answer: '', used: false })) }]);
  }

  function removeCategory(ci) {
    setDraft(d => d.filter((_, i) => i !== ci));
  }

  if (!authed) {
    return (
      <div className={styles.authWrap}>
        <form className={styles.authForm} onSubmit={handleAuth}>
          <h2>Admin Access</h2>
          <input
            type="password"
            placeholder="Enter admin secret"
            value={secret}
            onChange={e => setSecret(e.target.value)}
            className={styles.input}
            autoFocus
          />
          <button type="submit" className={styles.btn}>Enter</button>
        </form>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1>Admin</h1>
        <nav className={styles.tabs}>
          <button className={tab === 'cms' ? styles.activeTab : styles.tab} onClick={() => setTab('cms')}>Edit Questions</button>
          <button className={tab === 'control' ? styles.activeTab : styles.tab} onClick={() => setTab('control')}>Game Control</button>
        </nav>
      </header>

      {tab === 'cms' && (
        <div className={styles.cms}>
          {draft.map((cat, ci) => (
            <div key={ci} className={styles.category}>
              <div className={styles.categoryRow}>
                <input
                  className={styles.catName}
                  value={cat.name}
                  onChange={e => updateCategoryName(ci, e.target.value)}
                  placeholder="Category name"
                />
                <button className={styles.removeBtn} onClick={() => removeCategory(ci)}>Remove</button>
              </div>
              {cat.questions.map((q, qi) => (
                <div key={qi} className={styles.questionRow}>
                  <span className={styles.value}>${q.value}</span>
                  <input
                    className={styles.input}
                    value={q.text}
                    onChange={e => updateQuestion(ci, qi, 'text', e.target.value)}
                    placeholder="Question text"
                  />
                  <input
                    className={styles.input}
                    value={q.answer}
                    onChange={e => updateQuestion(ci, qi, 'answer', e.target.value)}
                    placeholder="Answer"
                  />
                  <input
                    className={`${styles.input} ${styles.inputImg}`}
                    value={q.imageUrl ?? ''}
                    onChange={e => updateQuestion(ci, qi, 'imageUrl', e.target.value)}
                    placeholder="Image URL (optional)"
                  />
                </div>
              ))}
            </div>
          ))}
          <div className={styles.cmsActions}>
            <button className={styles.btn} onClick={addCategory}>+ Add Category</button>
            <button className={styles.btnPrimary} onClick={saveAndStart}>Save & Go to Lobby</button>
            <button className={styles.btnDanger} onClick={resetGame}>Reset Game</button>
          </div>
        </div>
      )}

      {tab === 'control' && game && (
        <div className={styles.control}>
          <p className={styles.statusLine}>Status: <strong>{game.status}</strong></p>

          {game.status === 'lobby' && (
            <div>
              <p>Players joined:</p>
              <ul>
                {game.players && Object.values(game.players).map((p, i) => <li key={i}>{p.name}</li>)}
              </ul>
              <button className={styles.btnPrimary} onClick={() => update(ref(db, 'game'), { status: 'selecting' })}>
                Start Game
              </button>
            </div>
          )}

          {game.status === 'selecting' && game.categories && (
            <div className={styles.boardWrap}>
              <div className={styles.board}>
                {game.categories.map((cat, ci) => (
                  <div key={ci} className={styles.column}>
                    <div className={styles.categoryHeader}>{cat.name}</div>
                    {cat.questions.map((q, qi) => (
                      <button
                        key={qi}
                        className={`${styles.cell} ${q.used ? styles.cellUsed : ''}`}
                        disabled={q.used}
                        onClick={() => openQuestion(ci, qi)}
                      >
                        {q.used ? '' : `$${q.value}`}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {game.status === 'question' && game.currentQuestion && (
            <div className={styles.questionPanel}>
              <p><strong>Q:</strong> {game.currentQuestion.text}</p>
              <p><strong>A:</strong> {game.currentQuestion.answer}</p>
              <p>Waiting for buzz...</p>
              <div className={styles.actionRow}>
                <button className={styles.btn} onClick={revealAnswer}>Reveal Answer</button>
                <button className={styles.btnDanger} onClick={closeQuestion}>Skip / Close</button>
              </div>
            </div>
          )}

          {game.status === 'revealed' && (
            <div className={styles.questionPanel}>
              <p>Answer revealed on screen.</p>
              <button className={styles.btnPrimary} onClick={closeQuestion}>Close Question</button>
            </div>
          )}

          {(game.status === 'buzzing' || game.status === 'judging') && game.buzzer && (
            <div className={styles.judgePanel}>
              <p><strong>{game.buzzer.playerName}</strong> buzzed in!</p>
              <p><strong>Q:</strong> {game.currentQuestion?.text}</p>
              <p><strong>A:</strong> {game.currentQuestion?.answer}</p>
              <div className={styles.actionRow}>
                <button className={styles.btnPrimary} onClick={() => judgeAnswer(true)}>Correct ✓</button>
                <button className={styles.btnDanger} onClick={() => judgeAnswer(false)}>Wrong ✗</button>
                <button className={styles.btn} onClick={clearBuzzer}>Clear Buzzer</button>
              </div>
            </div>
          )}

          <hr className={styles.divider} />
          <div>
            <h3>Scores</h3>
            {game.players && Object.entries(game.players).map(([id, p]) => (
              <div key={id} className={styles.scoreRow}>
                <span>{p.name}</span>
                <span>${p.score}</span>
                <button className={styles.smallBtn} onClick={() => update(ref(db, `game/players/${id}`), { score: p.score + 100 })}>+100</button>
                <button className={styles.smallBtn} onClick={() => update(ref(db, `game/players/${id}`), { score: p.score - 100 })}>-100</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
