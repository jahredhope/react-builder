'use babel';
export default function stripFileName(filePath = '') {
  return filePath.substring(0, filePath.lastIndexOf('/'));
}
