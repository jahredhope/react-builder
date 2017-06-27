'use babel';
import { CompositeDisposable } from 'atom';

import path from 'path';

import { addError, addInfo } from './notification';

import convert from 'color-convert';

const getStyleForClass = require('./getStyleForClass');
const knockoutTemplateToJSX = require('./knockoutTemplateToJSX');

import createComponentFromTemplate from './createComponentFromTemplate';

export default {
  subscriptions: null,
  config: {
    someInt: {
      type: 'integer',
      default: 23,
      minimum: 1
    },
    templateLocation: {
      type: 'string',
      default: path.join(__dirname, 'template/')
    },
    replacedComponentName: {
      type: 'string',
      default: 'replacedComponentName'
    },
    newComponentName: {
      type: 'string',
      default: 'ReplaceMeNewComponent'
    }
  },

  activate(state) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(
      atom.commands.add('atom-workspace', {
        'react-builder:Convert Knockout Template To JSX': () =>
          this.knockoutTemplateToJSX(),
        'react-builder:getStyleForSelectedText': () =>
          this.getStyleForSelectedText(),
        'react-builder:newNestedComponent': () => this.newComponent(),
        'react-builder:newComponentHere': () => this.newComponentHere(),
        'react-builder:Get styles for selection': () =>
          this.getStylesForSelection(),
        'react-builder:Get styles for this page': () => this.getStylesForPage(),
        'react-builder:Convert to HSL': () => this.convertToHsl()
      })
    );
  },

  deactivate() {
    this.subscriptions.dispose();
  },
  getSelection() {
    let editor;
    if ((editor = atom.workspace.getActiveTextEditor())) {
      return editor.getSelectedText();
    }
    return null;
  },
  getText() {
    let editor;
    if ((editor = atom.workspace.getActiveTextEditor())) {
      return editor.getText();
    }
    return null;
  },
  convertToHsl() {
    const editor = atom.workspace.getActiveTextEditor();
    const text = this.getText();

    if (editor && text) {
      const rege = /#([A-Fa-f0-9]{2})([A-Fa-f0-9]{2})([A-Fa-f0-9]{2})/g;
      const newText = text.replace(rege, (str, r, g, b) => {
        console.log('Color', r, g, b);
        const hslArr = convert.rgb.hsl(
          parseInt(r, 16),
          parseInt(g, 16),
          parseInt(b, 16)
        );
        return `hsl(${hslArr[0]}, ${hslArr[1]}, ${hslArr[2]})`;
      });
      editor.setText(newText);
    }
  },
  knockoutTemplateToJSX() {
    const editor = atom.workspace.getActiveTextEditor();
    const text = this.getText();

    if (editor && text) {
      const newText = knockoutTemplateToJSX(text);

      if (newText) {
        addInfo('Converted to JSX');
        editor.setText(newText);
      }
    }
  },
  getStyleForSelectedText() {
    const selection = this.getSelection();
    if (selection) {
      getStyleForClass(selection).then(result => {
        console.log('RESULT', typeof result);
        atom.clipboard.write(result);
      });
    } else {
      addInfo('No Selection');
    }
  },

  getStylesForSelection() {
    let pageText = this.getSelection();
    let cssString = '';
    if (pageText) {
      const matches = pageText.match(
        /(class|className)=("|')[^"']{3,50}("|')/g
      );
      const classes = new Set();
      matches.forEach(match => {
        const classString = match.match(
          /(?:class|className)=(?:"|')([^"']{3,50})(?:"|')/
        )[1];
        if (classString) {
          classString.split(' ').forEach(newClass => classes.add(newClass));
        }
      });
      Array.from(classes)
        .reduce((promise, className) => {
          console.log('Getting styles for', className);
          return promise.then(() => {
            return getStyleForClass(className).then(newStyles => {
              cssString += '\n' + newStyles;
            });
          });
        }, Promise.resolve())
        .then(styles => {
          addInfo('All styles got');
          atom.clipboard.write(cssString);
        })
        .catch(err => {
          addError('ERROR getting styles');
          console.error('ERROR getting styles', err);
        });
    }
  },
  getStylesForPage() {
    let pageText = this.getText();
    let cssString = '';
    if (pageText) {
      const matches = pageText.match(
        /(class|className)=("|')[^"']{3,50}("|')/g
      );
      const classes = new Set();
      matches.forEach(match => {
        const classString = match.match(
          /(?:class|className)=(?:"|')([^"']{3,50})(?:"|')/
        )[1];
        if (classString) {
          classString.split(' ').forEach(newClass => classes.add(newClass));
        }
      });
      Array.from(classes)
        .reduce((promise, className) => {
          console.log('Getting styles for', className);
          return promise.then(() => {
            return getStyleForClass(className).then(newStyles => {
              cssString += '\n' + newStyles;
            });
          });
        }, Promise.resolve())
        .then(styles => {
          addInfo('All styles got');
          atom.clipboard.write(cssString);
        })
        .catch(error => console.error('ERROR getting styles', error));
    }
  },
  newComponent() {
    createComponentFromTemplate({ nestInClassName: true });
  },

  newComponentHere() {
    createComponentFromTemplate({ nestInClassName: false });
  }
};
