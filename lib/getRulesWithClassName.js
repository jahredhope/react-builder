const less = require('less');
const fs = require('fs');
let countTrace = 0;
let countReferences = 0;
function ruleHasSelector(rule, className) {
  if (rule.options && rule.options.reference) {
    countReferences++;
    return true;
  }
  const res =
    rule.selectors &&
    rule.selectors.some(
      selector =>
        selector.elements &&
        selector.elements.some(element => {
          const foundByCompare =
            element.value && element.value === '.' + className;
          return foundByCompare;
        })
    );
  if (res) {
    return true;
  }

  if (rule.rules) {
    const childRulesWithClass = rule.rules.filter(childRule =>
      ruleHasSelector(childRule, className)
    );
    rule.rules = childRulesWithClass;
    if (childRulesWithClass.length > 0) {
      return true;
    }
  }
  return false;
}

module.exports = (contents, className, fileName) => {
  return new Promise((resolve, reject) => {
    less.parse(
      contents,
      { filename: fileName },
      (err, root, imports, options) => {
        if (err) {
          console.error('ERROR Rendering', err.message || err);
          resolve(`/* Error Loading Classname ${fileName}*/`);
          return;
        }
        const newRules = root.rules.filter(rule =>
          ruleHasSelector(rule, className)
        );
        if (newRules && newRules.length > 0) {
          root.rules = newRules;
          try {
            const parseTree = new less.ParseTree(root, imports);
            resolve(parseTree.toCSS({}).css);
          } catch (err) {
            console.error('Unable to parse', fileName, err.message || err);
            resolve(`/* Unable to parse ${fileName}*/`);
          }
          return;
        }
        resolve(null);
      }
    );
  });
};
