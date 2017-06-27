import atom from 'atom';

module.exports = function() {
  const editor = atom.workspace.getActiveTextEditor();

  if (!editor) {
    return;
  }

  let selection = editor.getSelectedText();
  let className = (selection.match(/[a-zA-Z]{4,50}/) || [])[0];

  let editorPath = stripFileName(editor.getPath());

  if (className && editorPath) {
    const outputDir = path.join(editorPath, className);

    getTemplates(className).then(templates => templates.reduce((promise, template) => promise.then(() => writeFile(outputDir, template)), Promise.resolve())).then(() => {
      editor.setText(`import ${className} from './${className}'\n` + editor.getText());
      atom.notifications.addSuccess(`Created Component: ${className}`);
    });
  }
};
