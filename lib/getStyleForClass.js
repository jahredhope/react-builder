const path = require('path');
const fs = require('fs');

const recursive = require('recursive-readdir');

const getRulesWithClassName = require('./getRulesWithClassName');

let sourceFilesRoot = '/Users/jhope/adw/';
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
    lessSourceFiles = sourceFilesRoot;
    atom.config.set('react-builder.lessSourceFiles', lessSourceFiles);
  }

  if (!sourceFiles || sourceFilesRoot !== lessSourceFiles) {
    sourceFilesRoot = lessSourceFiles;
    return fromDir(sourceFilesRoot);
  }
  return Promise.resolve(sourceFiles);
}

function findInFile(file, className) {
  // console.log('is', 'findInFile', file)
  const contents = fs.readFileSync(file, 'utf8');
  // console.log('content', typeof contents)
  const match = contents.match(new RegExp(className));
  if (match) {
    // console.log('grep match', file)
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
        // fs.writeFileSync('./output.css', filteredCss.join('\n\n\n'))
      })
      .catch(err => {
        console.error('All Error', err);
        throw err;
      });
  });
};

// getStyleForClass('nav-main__create-job').then((css) => fs.writeFileSync('./debug.css', css))
module.exports = getStyleForClass;
