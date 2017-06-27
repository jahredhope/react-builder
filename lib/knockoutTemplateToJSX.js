module.exports = templateContents => {
    const regexKoDomless = /<!-- ko ([^ :]{2,50}): ([^ -]{2,60}) -->/g;
    const jsxContents = templateContents
        .replace(/<br>/g, '<br />')
        .replace(/ class=/g, ' className=')
        .replace(/<!--.*-->/g, match => `{/* ${match} */}`);

    const valuesFound = new Set();
    templateContents.replace(regexKoDomless, (match, command, value) => {
        valuesFound.add(value.match(/[a-zA-Z]{2,50}/)[0]);
    });
    templateContents.replace(/data-bind="(.*?)"/g, (match, objString) => {
        if (objString[0] === '{') {
            objString = objString.substring(1);
        }
        if (objString[objString.length - 1] === '}') {
            objString = objString.substring(0, objString.length - 2);
        }
        const objResult = objString.split(',');
        objString.replace(/: *([a-zA-Z]{2,50})/g, (val, field) => {
            valuesFound.add(field);
        });
    });

    const CLASS_NAME = 'ReplaceMeNewComponent';

    console.log('Found params:', Array.from(valuesFound));

    return `import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';

function ${CLASS_NAME}({${Array.from(valuesFound).join(', ')}}) {
  return (
    <div>
    ${jsxContents}
    </div>)
  }

  ${CLASS_NAME}.propTypes = {
    ${Array.from(valuesFound)
        .map(v => `${v}: PropTypes.any.isRequired`)
        .join(',\n')}
}

export default ${CLASS_NAME};`;
};
