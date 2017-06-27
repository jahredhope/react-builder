'use babel';

import path from 'path';
import fs from 'fs';

function writeFilePromise(filename, contents) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, contents, err => {
      console.log('WRITE FILE RESULT:', err);
      !err ? resolve() : reject(err);
    });
  });
}
function existsPromise(filename) {
  console.log('existsPromise', filename);
  return new Promise(function(resolve) {
    fs.stat(filename, function(err) {
      console.log('EXISTS', err);
      resolve(!err);
    });
  });
}
function mkdirPromise(dirname) {
  return new Promise(function(resolve, reject) {
    fs.mkdir(dirname, function(err) {
      !err ? resolve() : reject(err);
    });
  });
}

export function writeFile(outputDir, { name, contents }) {
  const outputPath = path.join(outputDir, name);
  console.log('WRITING', name, contents.length);
  console.log('DIR', outputPath);
  return existsPromise(outputDir)
    .then(doesExist => {
      console.log('CHECKING IF EXIST', name);
      if (!doesExist) {
        console.log('CREATE DIR', outputDir);
        return mkdirPromise(outputDir);
      }
      return true;
    })
    .then(() => {
      console.log('TRYING TO WRITE', name);
      return writeFilePromise(outputPath, contents).catch(error => {
        console.error('Error writing file', error);
      });
    });
}
export function readdirPromise(dirname) {
  console.log('readdirPromise');
  return new Promise((resolve, reject) => {
    console.log('readdirPromise', 'promise');
    fs.readdir(dirname, (err, files) => (err ? reject(err) : resolve(files)));
  });
}
