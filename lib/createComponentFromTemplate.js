'use babel';
import path from 'path';
import { addSuccess, addInfo } from './notification';
import { writeFile } from './file';
import stripFileName from './stripFileName';
import getTemplates from './getTemplates';

export default function createComponentFromTemplate({
  nestInClassName = true
}) {
  const editor = atom.workspace.getActiveTextEditor();
  if (!editor) {
    addInfo('No Editor');
    return;
  }
  let selection = (editor.getSelectedText().match(/[a-zA-Z]{4,50}/) || [])[0];
  let editorPath = stripFileName(editor.getPath() || '');
  if (!selection) {
    addInfo('No Selection');
    return;
  }
  if (!editorPath) {
    addInfo('No Path');
    return;
  }
  const className = selection;
  const outputDir = nestInClassName
    ? path.join(editorPath, className)
    : editorPath;

  console.log('CREATING COMPONENT', className, 'IN', outputDir);

  getTemplates(className)
    .then(templates =>
      templates.reduce(
        (promise, template) =>
          promise.then(() => writeFile(outputDir, template)),
        Promise.resolve()
      )
    )
    .then(() => {
      console.log('FINISHED ADDING FILES');
      editor.setText(
        `import ${className} from './${className}'\n` + editor.getText()
      );
      addSuccess(`Created Component: ${className}`);
    });
}
