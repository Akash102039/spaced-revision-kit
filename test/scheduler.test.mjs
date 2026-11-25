import test from 'node:test';
import assert from 'node:assert/strict';
import { createCard, reviewCard, validateCard, validateDeck, dueCards, summarize } from '../src/scheduler.mjs';

const day0 = '2026-01-01T00:00:00.000Z';
const a = () => createCard({id:'1',front:'Question',back:'Answer',topic:'Math'}, day0);

test('new cards are due immediately without mutating inputs', () => {
  const card = a();
  assert.equal(dueCards([card], day0).length, 1);
  assert.equal(summarize([card], day0).new, 1);
  assert.equal(card.intervalDays, 0);
});
test('successful reviews use 1, 6 and expanding intervals', () => {
  const first = reviewCard(a(), 4, day0);
  const second = reviewCard(first, 4, first.dueAt);
  const third = reviewCard(second, 4, second.dueAt);
  assert.equal(first.intervalDays, 1);
  assert.equal(second.intervalDays, 6);
  assert.ok(third.intervalDays > 6);
  assert.equal(a().repetitions, 0);
});
test('incorrect answer resets streak and counts lapse', () => {
  const good = reviewCard(a(), 5, day0);
  const failed = reviewCard(good, 1, good.dueAt);
  assert.equal(failed.repetitions, 0);
  assert.equal(failed.intervalDays, 1);
  assert.equal(failed.lapses, 1);
});
test('ease has a 1.3 lower bound', () => {
  let card = a();
  for (let i = 0; i < 20; i++) card = reviewCard(card, 0, day0);
  assert.equal(card.ease, 1.3);
});
test('invalid grades and bad dates fail safely', () => {
  assert.throws(() => reviewCard(a(), 6), RangeError);
  assert.throws(() => reviewCard(a(), 2.5), RangeError);
  assert.throws(() => createCard({id:'',front:'Q',back:'A'}), TypeError);
  assert.throws(() => createCard({id:'1',front:'Q',back:'A'}, 'not-a-date'), TypeError);
});
test('rejects duplicate IDs and malformed imported decks', () => {
  assert.throws(() => validateDeck([a(), a()]), /Duplicate/);
  assert.throws(() => validateCard({...a(), dueAt:'bad'}), /Invalid date/);
  assert.throws(() => validateDeck({cards:[]}), /array/);
  assert.throws(() => validateDeck(Array(5001).fill(a())), /5000/);
});
test('due cards sorted and time-sensitive', () => {
  const first = a();
  const later = {...a(),id:'2',dueAt:'2026-01-04T00:00:00.000Z'};
  assert.deepEqual(dueCards([later,first], day0).map(card=>card.id), ['1']);
  assert.deepEqual(dueCards([later,first], '2026-01-06').map(card=>card.id), ['1','2']);
});
test('summaries distinguish new and practiced cards', () => {
  const practiced = {...reviewCard(a(), 3, day0), id:'2'};
  assert.deepEqual(summarize([a(),practiced], day0), {total:2,due:1,new:1,practiced:1});
});
