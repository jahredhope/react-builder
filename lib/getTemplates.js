'use babel';
import fs from 'fs';
import path from 'path';
import { getConfig } from './config';
import { readdirPromise } from './file';

export default function getTemplates(newName) {
  const templateRoot = getConfig('templateLocation');
  const replacedComponentName = getConfig('replacedComponentName');

  return readdirPromise(templateRoot)
    .then(files => files.map(file => path.join(templateRoot, file)))
    .then(files => {
      return files.map(fileName => {
        console.log('READING', fileName);
        const templateFileContents = fs.readFileSync(fileName, 'utf8');
        console.log('READ', fileName, templateFileContents);
        return {
          name: fileName
            .replace(replacedComponentName, newName)
            .split('/')
            .pop(),
          originalTemplateName: fileName,
          originalTemplate: templateFileContents,
          contents: templateFileContents.replace(
            new RegExp(replacedComponentName, 'g'),
            newName
          )
        };
      });
    });
}
