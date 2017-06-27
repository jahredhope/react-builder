"use babel";

import ReactBuildView from "./react-builder-view";
import { CompositeDisposable } from "atom";

import path from "path";
import fs from "fs";

import convert from "color-convert";

const getStyleForClass = require("./getStyleForClass");
const knockoutTemplateToJSX = require("./knockoutTemplateToJSX");

const replacedComponentName = "replacedComponentName";

// const findRoot = require('./findRoot');

function getTemplates(newName) {
  const templateRoot = atom.config.get("react-builder.templateLocation");
  return readdirPromise(templateRoot)
    .then(files => files.map(file => path.join(templateRoot, file)))
    .then(files => {
      return files.map(fileName => {
        console.log("READING", fileName);
        const templateFileContents = fs.readFileSync(fileName, "utf8");
        console.log("READ", fileName, templateFileContents);
        return {
          name: fileName
            .replace(replacedComponentName, newName)
            .split("/")
            .pop(),
          originalTemplateName: fileName,
          originalTemplate: templateFileContents,
          contents: templateFileContents.replace(
            new RegExp(replacedComponentName, "g"),
            newName
          )
        };
      });
    });
}

function writeFilePromise(filename, contents) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, contents, err => {
      console.log("WRITE FILE RESULT:", err);
      !err ? resolve() : reject(err);
    });
  });
}
function existsPromise(filename) {
  console.log("existsPromise", filename);
  return new Promise(function(resolve) {
    fs.stat(filename, function(err) {
      console.log("EXISTS", err);
      resolve(!err);
    });
  });
}
function mkdirPromise(dirname) {
  return new Promise(function(resolve) {
    fs.mkdir(dirname, function(err) {
      !err ? resolve() : reject(err);
    });
  });
}
function readdirPromise(dirname) {
  console.log("readdirPromise");
  return new Promise((resolve, reject) => {
    console.log("readdirPromise", "promise");
    fs.readdir(dirname, (err, files) => (err ? reject(err) : resolve(files)));
  });
}

function writeFile(outputDir, { name, contents }) {
  const outputPath = path.join(outputDir, name);
  console.log("WRITING", name, contents.length);
  console.log("DIR", outputPath);
  return existsPromise(outputDir)
    .then(doesExist => {
      console.log("CHECKING IF EXIST", name);
      if (!doesExist) {
        console.log("CREATE DIR", outputDir);
        return mkdirPromise(outputDir);
      }
      return true;
    })
    .then(() => {
      console.log("TRYING TO WRITE", name);
      return writeFilePromise(outputPath, contents).catch(error => {
        console.error("Error writing file", error);
      });
    });
}

function stripFileName(filePath) {
  return filePath.substring(0, filePath.lastIndexOf("/"));
}

export default {
  subscriptions: null,

  activate(state) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(
      atom.commands.add("atom-workspace", {
        "react-builder:Convert Knockout Template To JSX": () =>
          this.knockoutTemplateToJSX(),
        "react-builder:getStyleForSelectedText": () =>
          this.getStyleForSelectedText(),
        "react-builder:newNestedComponent": () => this.component(),
        "react-builder:newComponentHere": () => this.newComponentHere(),
        "react-builder:Get styles for selection": () =>
          this.getStylesForSelection(),
        "react-builder:Get styles for this page": () => this.getStylesForPage(),
        "react-builder:Convert to HSL": () => this.convertToHsl()
      })
    );
    if (!atom.config.get("react-builder.templateLocation")) {
      atom.config.set(
        "react-builder.templateLocation",
        path.join(__dirname, "template/")
      );
    }
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
        console.log("Color", r, g, b);
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
        atom.notifications.addInfo("Converted to JSX");
        editor.setText(newText);
      }
    }
  },
  getStyleForSelectedText() {
    const selection = this.getSelection();
    if (selection) {
      getStyleForClass(selection).then(result => {
        console.log("RESULT", typeof result);
        atom.clipboard.write(result);
      });
    } else {
      atom.notifications.addInfo("No Selection");
    }
  },

  getStylesForSelection() {
    let pageText = this.getSelection();
    let cssString = "";
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
          classString.split(" ").forEach(newClass => classes.add(newClass));
        }
      });
      Array.from(classes)
        .reduce((promise, className) => {
          console.log("Getting styles for", className);
          return promise.then(() => {
            return getStyleForClass(className).then(newStyles => {
              cssString += "\n" + newStyles;
            });
          });
        }, Promise.resolve())
        .then(styles => {
          atom.notifications.addInfo("All styles got");
          atom.clipboard.write(cssString);
        })
        .catch(error => {
          atom.notifications.addError("ERROR getting styles");
          console.error("ERROR getting styles", error);
        });
    }
  },
  getStylesForPage() {
    let pageText = this.getText();
    let cssString = "";
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
          classString.split(" ").forEach(newClass => classes.add(newClass));
        }
      });
      Array.from(classes)
        .reduce((promise, className) => {
          console.log("Getting styles for", className);
          return promise.then(() => {
            return getStyleForClass(className).then(newStyles => {
              cssString += "\n" + newStyles;
            });
          });
        }, Promise.resolve())
        .then(styles => {
          atom.notifications.addInfo("All styles got");
          atom.clipboard.write(cssString);
        })
        .catch(error => console.error("ERROR getting styles", error));
    }
  },
  component() {
    let editor;
    if ((editor = atom.workspace.getActiveTextEditor())) {
      let selection = (editor.getSelectedText().match(/[a-zA-Z]{4,50}/) ||
        [])[0];
      let editorPath = stripFileName(editor.getPath());
      if (selection && editorPath) {
        console.log("CREATING COMPONENT", selection, "IN", editorPath);
        const outputDir = path.join(editorPath, selection);

        getTemplates(selection)
          .then(templates =>
            templates.reduce(
              (promise, template) =>
                promise.then(() => writeFile(outputDir, template)),
              Promise.resolve()
            )
          )
          .then(() => {
            console.log("FINISHED ADDING FILES");
            editor.setText(
              `import ${selection} from './${selection}'\n` + editor.getText()
            );
            atom.notifications.addSuccess(`Created Component: ${selection}`);
          });
      }
    }
  },

  newComponentHere() {
    let editor;
    if ((editor = atom.workspace.getActiveTextEditor())) {
      let selection = (editor.getSelectedText().match(/[a-zA-Z]{4,50}/) ||
        [])[0];
      let editorPath = stripFileName(editor.getPath());
      if (selection && editorPath) {
        console.log("CREATING COMPONENT", selection, "IN", editorPath);
        const outputDir = editorPath; //path.join(editorPath, selection);

        getTemplates(selection)
          .then(templates =>
            templates.reduce(
              (promise, template) =>
                promise.then(() => writeFile(outputDir, template)),
              Promise.resolve()
            )
          )
          .then(() => {
            console.log("FINISHED ADDING FILES");
            editor.setText(
              `import ${selection} from './${selection}'\n` + editor.getText()
            );
            atom.notifications.addSuccess(`Created Component: ${selection}`);
          });
      }
    }
  }
};
