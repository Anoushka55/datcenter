// Word budgets for the cockpit's text. These hold the line as content is
// added: a card is read at a glance, a drill-down answer in one breath.
//
//   card question       <= 12 words
//   card insight line   <= 18 words, exactly one bold span
//   drill-down answer   <= 25 words
//   drill-down finding  <= 20 words, at most four, one bold span each
//   open question       <= 20 words, at most three, phrased as a finding
//   no paragraph on the card face: the insight is one sentence
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CARD_IDS, cardFor } from './view.js';

const words = (s) => s.trim().split(/\s+/).filter(Boolean).length;
const sentences = (s) => s.split(/[.!?](\s|$)/).filter((x) => x && x.trim().length > 1).length;

export const BUDGET = { question: 12, insight: 18, answer: 25, finding: 20, findings: 4, openQuestions: 3 };

test('card questions fit in twelve words', () => {
  for (const id of CARD_IDS) {
    const q = cardFor(id).question;
    assert.ok(words(q) <= BUDGET.question, `${id} question is ${words(q)} words: ${q}`);
  }
});

test('each card insight is one sentence of at most eighteen words, with one bold span', () => {
  for (const id of CARD_IDS) {
    const c = cardFor(id).insight;
    assert.ok(words(c.label) <= BUDGET.insight, `${id} insight is ${words(c.label)} words: ${c.label}`);
    assert.equal(sentences(c.label), 1, `${id} insight is not one sentence: ${c.label}`);
    assert.ok(c.emphasis && c.label.includes(c.emphasis) && words(c.emphasis) < words(c.label), `${id} insight needs one bold span`);
  }
});

test('each drill-down answer fits in twenty-five words', () => {
  for (const id of CARD_IDS) {
    const c = cardFor(id).answer;
    assert.ok(words(c.label) <= BUDGET.answer, `${id} answer is ${words(c.label)} words: ${c.label}`);
  }
});

test('each drill-down has at most four findings of at most twenty words, one bold span each', () => {
  for (const id of CARD_IDS) {
    const brief = cardFor(id).brief;
    assert.ok(brief.length >= 1 && brief.length <= BUDGET.findings, `${id} has ${brief.length} findings`);
    for (const c of brief) {
      assert.ok(words(c.label) <= BUDGET.finding, `${c.id} is ${words(c.label)} words: ${c.label}`);
      assert.ok(c.emphasis && c.label.includes(c.emphasis) && words(c.emphasis) < words(c.label), `${c.id} needs one bold span`);
    }
  }
});

test('open questions: at most three, each a finding of at most twenty words with one bold span', () => {
  for (const id of CARD_IDS) {
    const qs = cardFor(id).openQuestions;
    assert.ok(qs.length <= BUDGET.openQuestions, `${id} has ${qs.length} open questions`);
    for (const c of qs) {
      assert.ok(words(c.label) <= BUDGET.finding, `${c.id} is ${words(c.label)} words: ${c.label}`);
      assert.ok(c.emphasis && c.label.includes(c.emphasis), `${c.id} needs one bold span`);
      assert.doesNotMatch(c.label, /input required|computes from upstream/i, c.id);
    }
  }
});

test('the word counter itself counts what a reader sees', () => {
  assert.equal(words('At US$6.6/W the figure sits below India’s US$7/W benchmark.'), 9);
  assert.equal(sentences('One sentence; with a clause.'), 1);
  assert.equal(sentences('Two. Sentences.'), 2);
});
