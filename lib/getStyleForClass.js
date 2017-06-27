'use babel';
const fs = require('fs');

const recursive = require('recursive-readdir');

const getRulesWithClassName = require('./getRulesWithClassName');
import { addError } from './notification';

let sourceFilesRoot;
let sourceFiles;

function fromDir(startPath) {
  return new Promise((resolve, reject) => {
    recursive(startPath, (err, files) => {
      if (err) {
        reject(err);
        return;
      }
      if (!files) {
        reject('No Files Found');
        return;
      }
      resolve(files.filter(file => file.match(/\.less$/)));
    });
  });
}

function getFiles() {
  const lessSourceFiles = atom.config.get('react-builder.lessSourceFiles');
  if (!lessSourceFiles) {
    addError('Missing lessSourceFiles');
  }

  if (!sourceFiles || sourceFilesRoot !== lessSourceFiles) {
    sourceFilesRoot = lessSourceFiles;
    return fromDir(sourceFilesRoot);
  }
  return Promise.resolve(sourceFiles);
}

function findInFile(file, className) {
  const contents = fs.readFileSync(file, 'utf8');
  const match = contents.match(new RegExp(className));
  if (match) {
    return getRulesWithClassName(contents, className, file);
  }
  Promise.resolve();
}

const getStyleForClass = className => {
  return getFiles().then(files => {
    const filePromises = files.map(file => {
      return findInFile(file, className);
    });

    return Promise.all(filePromises)
      .then(classes => {
        const filteredCss = classes.filter(css => !!css);
        console.log('CSS', filteredCss.length, 'of', classes.length);
        return filteredCss.join('\n');
      })
      .catch(err => {
        console.error('All Error', err);
        throw err;
      });
  });
};
module.exports = getStyleForClass;
