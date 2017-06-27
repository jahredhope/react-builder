'use babel';

const rootRegex = /components?|containers?|libs?/i;

module.exports = function findRoot(dir) {
  const match = dir.match(rootRegex);
  const matchIndex = match.index;
  const matchLength = match[0].length;
  return dir.substr(0, matchIndex + matchLength);
};
