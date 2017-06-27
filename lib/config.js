'use babel';

module.exports = {
  getConfig: key => atom.config.get(`react-builder.${key}`),
  setConfig: (key, val) => atom.config.set(`react-builder.${key}`, val)
};
