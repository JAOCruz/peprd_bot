const { PEPTIDE_TOPICS } = require('./peptideTopics');
const { INSTITUTIONS } = require('./institutions');
const { normalize } = require('../conversation/nlp');

function searchKnowledge(query) {
  const norm = normalize(query);
  const words = norm.split(/\s+/).filter(w => w.length > 2);
  const results = [];

  for (const [key, topic] of Object.entries(PEPTIDE_TOPICS)) {
    let score = 0;
    for (const word of words) {
      for (const kw of (topic.keywords || [])) {
        if (kw.includes(word) || word.includes(kw)) score++;
      }
      if ((topic.title || '').toLowerCase().includes(word)) score += 2;
    }
    if (score > 0) results.push({ type: 'peptide_topic', key, score, data: topic });
  }

  for (const [key, inst] of Object.entries(INSTITUTIONS)) {
    let score = 0;
    for (const word of words) {
      for (const kw of (inst.keywords || [])) {
        if (kw.includes(word) || word.includes(kw)) score++;
      }
      if ((inst.name || '').toLowerCase().includes(word)) score += 2;
    }
    if (score > 0) results.push({ type: 'institution', key, score, data: inst });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 5);
}

function formatSearchResults(results, limit = 3) {
  if (!results || !results.length) return '';
  return results.slice(0, limit).map((r) => {
    if (r.type === 'peptide_topic') {
      return `${r.data.title}\n${(r.data.content || '').substring(0, 300)}`;
    }
    if (r.type === 'institution') {
      return `${r.data.name} — ${r.data.url || ''}`;
    }
    return '';
  }).filter(Boolean).join('\n\n');
}

module.exports = { searchKnowledge, formatSearchResults };
