/**
 * Dependency-free SM-2-inspired spaced repetition scheduling.
 * All persisted dates use UTC ISO 8601 timestamps.
 * This is an educational scheduler, not a prediction of exam results.
 * @license MIT
 */
const DAY_MS = 86_400_000;
function timestamp(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new TypeError('Invalid date');
  return date.toISOString();
}
function requiredText(value, name) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError(`${name} must be a non-empty string`);
  }
  return value.trim();
}
/** Creates a review card that is due immediately. */
export function createCard({ id, front, back, topic = '' }, at = new Date()) {
  return {
    id: requiredText(id, 'id'),
    front: requiredText(front, 'front'),
    back: requiredText(back, 'back'),
    topic: String(topic).trim(),
    repetitions: 0,
    intervalDays: 0,
    ease: 2.5,
    lapses: 0,
    dueAt: timestamp(at),
    lastReviewedAt: null
  };
}
/**
 * Grades: 0 (forgot), 1 (incorrect), 2 (difficult), 3 (correct),
 * 4 (good), 5 (easy). Returns a new card; never mutates input.
 */
export function reviewCard(card, grade, at = new Date()) {
  validateCard(card);
  if (!Number.isInteger(grade) || grade < 0 || grade > 5) {
    throw new RangeError('grade must be an integer from 0 to 5');
  }
  const now = timestamp(at);
  const delta = 5 - grade;
  const ease = Math.max(1.3, card.ease + 0.1 - delta * (0.08 + delta * 0.02));
  const passed = grade >= 3;
  const repetitions = passed ? card.repetitions + 1 : 0;
  const intervalDays = !passed ? 1 : repetitions === 1 ? 1 : repetitions === 2 ? 6 : Math.max(1, Math.round(card.intervalDays * ease));
  return {
    ...card,
    repetitions,
    intervalDays,
    ease: Number(ease.toFixed(3)),
    lapses: card.lapses + (passed ? 0 : 1),
    dueAt: new Date(Date.parse(now) + intervalDays * DAY_MS).toISOString(),
    lastReviewedAt: now
  };
}
/** Validate imported card data; rejects malformed timestamps and numbers. */
export function validateCard(card) {
  if (!card || typeof card !== 'object' || Array.isArray(card)) throw new TypeError('Card must be an object');
  requiredText(card.id, 'id');
  requiredText(card.front, 'front');
  requiredText(card.back, 'back');
  if (typeof card.topic !== 'string') throw new TypeError('topic must be a string');
  if (!Number.isInteger(card.repetitions) || card.repetitions < 0) throw new TypeError('Invalid repetitions');
  if (!Number.isInteger(card.intervalDays) || card.intervalDays < 0) throw new TypeError('Invalid interval');
  if (typeof card.ease !== 'number' || !Number.isFinite(card.ease) || card.ease < 1.3) throw new TypeError('Invalid ease');
  if (!Number.isInteger(card.lapses) || card.lapses < 0) throw new TypeError('Invalid lapses');
  timestamp(card.dueAt);
  if (card.lastReviewedAt !== null) timestamp(card.lastReviewedAt);
  return true;
}
/** Validate complete imported decks, including unique IDs and size cap. */
export function validateDeck(cards) {
  if (!Array.isArray(cards) || cards.length > 5000) throw new TypeError('Deck must be an array with no more than 5000 cards');
  const ids = new Set();
  for (const card of cards) {
    validateCard(card);
    if (ids.has(card.id)) throw new TypeError(`Duplicate card id: ${card.id}`);
    ids.add(card.id);
  }
  return cards;
}
/** Lists cards due at or before the supplied time, earliest first. */
export function dueCards(cards, at = new Date()) {
  validateDeck(cards);
  const now = Date.parse(timestamp(at));
  return cards.filter(card => Date.parse(card.dueAt) <= now)
    .sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt));
}
export function summarize(cards, at = new Date()) {
  validateDeck(cards);
  return {
    total: cards.length,
    due: dueCards(cards, at).length,
    new: cards.filter(card => card.lastReviewedAt === null).length,
    practiced: cards.filter(card => card.lastReviewedAt !== null).length
  };
}
