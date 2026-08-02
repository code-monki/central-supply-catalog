const fieldWeights = {
  name: 80,
  sku: 50,
  summary: 35,
  description: 20,
  cost: 5,
};

const normalizeText = (value = '') =>
  String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

const tokenizeText = (value = '') => normalizeText(value).split(' ').filter(Boolean);

const tokenizeQuery = (query) => {
  const tokens = [];
  let position = 0;

  while (position < query.length) {
    const char = query[position];

    if (/\s/.test(char)) {
      position += 1;
      continue;
    }

    if (char === '(') {
      tokens.push({ type: 'LPAREN' });
      position += 1;
      continue;
    }

    if (char === ')') {
      tokens.push({ type: 'RPAREN' });
      position += 1;
      continue;
    }

    if (char === '"') {
      let phrase = '';
      position += 1;

      while (position < query.length && query[position] !== '"') {
        phrase += query[position];
        position += 1;
      }

      if (query[position] === '"') position += 1;
      const normalized = normalizeText(phrase);
      if (normalized) tokens.push({ type: 'PHRASE', value: normalized });
      continue;
    }

    let word = '';
    while (position < query.length && !/[\s()"]/.test(query[position])) {
      word += query[position];
      position += 1;
    }

    const normalized = normalizeText(word);
    if (!normalized) continue;

    const operator = normalized.toUpperCase();
    if (operator === 'AND' || operator === 'OR' || operator === 'NOT') {
      tokens.push({ type: operator });
    } else {
      tokens.push({ type: 'TERM', value: normalized });
    }
  }

  return tokens;
};

const isExpressionStart = (token) => token && ['TERM', 'PHRASE', 'LPAREN', 'NOT'].includes(token.type);

const parseQuery = (query) => {
  const tokens = tokenizeQuery(query);
  let position = 0;

  const peek = () => tokens[position];
  const consume = () => tokens[position++];

  const parsePrimary = () => {
    const token = consume();

    if (!token) return { type: 'empty' };
    if (token.type === 'TERM') return { type: 'term', value: token.value };
    if (token.type === 'PHRASE') return { type: 'phrase', value: token.value };

    if (token.type === 'LPAREN') {
      const node = parseOr();
      if (peek()?.type === 'RPAREN') consume();
      return node;
    }

    return { type: 'empty' };
  };

  const parseNot = () => {
    if (peek()?.type === 'NOT') {
      consume();
      return { type: 'not', child: parseNot() };
    }

    return parsePrimary();
  };

  const parseAnd = () => {
    let node = parseNot();

    while (true) {
      const token = peek();
      if (token?.type === 'AND') {
        consume();
        node = { type: 'and', children: [node, parseNot()] };
        continue;
      }

      if (isExpressionStart(token)) {
        node = { type: 'and', children: [node, parseNot()] };
        continue;
      }

      break;
    }

    return node;
  };

  const parseOr = () => {
    let node = parseAnd();

    while (peek()?.type === 'OR') {
      consume();
      node = { type: 'or', children: [node, parseAnd()] };
    }

    return node;
  };

  const ast = parseOr();
  return tokens.length > 0 ? ast : { type: 'empty' };
};

const searchableFieldsFor = (document) => ({
  name: normalizeText(document.name),
  sku: normalizeText(document.sku),
  summary: normalizeText(document.summary),
  description: normalizeText(document.description),
  cost: normalizeText(document.cost),
});

const indexedDocumentFor = (document) => {
  const fields = searchableFieldsFor(document);
  const tokens = Object.fromEntries(Object.entries(fields).map(([field, text]) => [field, tokenizeText(text)]));

  return {
    document,
    fields,
    tokens,
  };
};

const termMatchesField = (tokens, term) => tokens.some((token) => token.startsWith(term));
const phraseMatchesField = (text, phrase) =>
  text === phrase || text.includes(` ${phrase} `) || text.startsWith(`${phrase} `) || text.endsWith(` ${phrase}`);

const evaluate = (node, indexedDocument) => {
  switch (node.type) {
    case 'term':
      return Object.values(indexedDocument.tokens).some((tokens) => termMatchesField(tokens, node.value));
    case 'phrase':
      return Object.values(indexedDocument.fields).some((text) => phraseMatchesField(text, node.value));
    case 'not':
      return node.child.type !== 'empty' && !evaluate(node.child, indexedDocument);
    case 'and':
      return node.children.every((child) => evaluate(child, indexedDocument));
    case 'or':
      return node.children.some((child) => evaluate(child, indexedDocument));
    default:
      return false;
  }
};

const scoreTerm = (term, indexedDocument) =>
  Object.entries(indexedDocument.tokens).reduce((score, [field, tokens]) => {
    const exact = tokens.includes(term);
    const prefix = !exact && termMatchesField(tokens, term);
    if (exact) return score + fieldWeights[field];
    if (prefix) return score + fieldWeights[field] * 0.45;
    return score;
  }, 0);

const scorePhrase = (phrase, indexedDocument) =>
  Object.entries(indexedDocument.fields).reduce((score, [field, text]) => {
    if (!phraseMatchesField(text, phrase)) return score;
    const exactField = text === phrase ? 2 : 1;
    const phraseLength = tokenizeText(phrase).length;
    const fieldLength = Math.max(indexedDocument.tokens[field].length, 1);
    return score + fieldWeights[field] * 3 * exactField + fieldWeights[field] * (phraseLength / fieldLength);
  }, 0);

const score = (node, indexedDocument) => {
  switch (node.type) {
    case 'term':
      return scoreTerm(node.value, indexedDocument);
    case 'phrase':
      return scorePhrase(node.value, indexedDocument);
    case 'not':
      return 0;
    case 'and':
      return node.children.reduce((total, child) => total + score(child, indexedDocument), 0);
    case 'or':
      return Math.max(...node.children.map((child) => score(child, indexedDocument)));
    default:
      return 0;
  }
};

export const searchCatalogDocuments = (documents, rawQuery) => {
  const ast = parseQuery(rawQuery);
  if (ast.type === 'empty') return [];

  return documents
    .map(indexedDocumentFor)
    .filter((indexedDocument) => evaluate(ast, indexedDocument))
    .map((indexedDocument) => ({
      ...indexedDocument.document,
      score: score(ast, indexedDocument),
    }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name) || a.sku.localeCompare(b.sku));
};

export const parseCatalogSearchQuery = parseQuery;
