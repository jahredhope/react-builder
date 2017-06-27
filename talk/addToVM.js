const fs = require('fs');
const { log } = require('./logger');
const { writeFile } = require('./file');
const path = require('path');
const camelCase = require('camelcase');

const staticResourcePathString = 'this.staticResourcePath = window.staticResourcePath;';

// Returns the name of the controller in the file
function getControllerName(file) {
  const contents = fs.readFileSync(file, 'utf8');
  const match = contents.match(/controllerAs: ?'(\w{3,40})'/);
  if (!match || !match[1]) {
    throw new Error('Cannot find controller name for ' + file);
  }
  return match[1];
}

// Adds a controller to the View Model
function addControllerToDirective(file) {
  const contents = fs.readFileSync(file, 'utf8');
  const toReplace = contents.match(/([ \t]*)scope: ?false/);

  if (!toReplace || !toReplace[0] || !toReplace[1]) {
    throw new Error('No Scope param in directive without controller');
  }
  const controllerName = camelCase(path.basename(file) + '-view').replace('DirectiveJs', '');
  const whitespace = toReplace[1];
  log('addControllerToDirective', toReplace, controllerName);

  const newContent = contents.replace(
    toReplace[0],
    `${whitespace}bindToController: true,
${whitespace}controllerAs: '${controllerName}',
${whitespace}controller: function () {
${whitespace}  this.staticResourcePath = window.staticResourcePath;
${whitespace}}
`
  );
  writeFile(file, newContent);
  return controllerName;
}

// Adds staticResourcePath to View Model (or passes on to add a Controller)
function addStaticToDirective(file) {
  const contents = fs.readFileSync(file, 'utf8');

  if (contents.indexOf('staticResourcePath') >= 0) {
    return;
  }

  const regexController = /\Wcontroller:(.|\n)*\n([ \t]*)(const|var) (\w{3,40}) = this;\n/;
  const controllerMatch = contents.match(regexController);
  if (controllerMatch) {
    const breakIndex = controllerMatch.index + controllerMatch[0].length + 1; // contents.indexOf('\n', )
    const whitespace = controllerMatch[2];
    const newContents = contents.substr(0, breakIndex - 1) + whitespace + staticResourcePathString + '\n' + contents.substr(breakIndex - 1);
    log('Writing', file);
    writeFile(file, newContents);
  } else {
    log('NO Controller in', file);
    addControllerToDirective(file);
  }
}

// Now we have a controller name lets add staticResourcePath to src
function replaceFileWithControllerScope(file, controllerName) {
  // Go find the relevant places
  const imageRegex = /\/Content\/Images\//g;
  const assetRegex = /\/Content\/Pdfs\//g;

  // Read the file
  const content = fs.readFileSync(file, 'utf8');

  const count = (content.match(imageRegex) || []).length + (content.match(assetRegex) || []).length;
  if (count > 0) {
    // Modify the contents
    const newContent = content.replace(imageRegex, `{{${controllerName}.staticResourcePath}}images/`).replace(assetRegex, `{{${controllerName}.staticResourcePath}}assets/`);
    log('Replacing', count, 'times in', file);

    // Write the file
    writeFile(file, newContent);
  } else {
    np;
    log('Nothing to replace in', file);
  }
}

module.exports = {
  getControllerName,
  addControllerToDirective,
  addStaticToDirective,
  replaceFileWithControllerScope
};
