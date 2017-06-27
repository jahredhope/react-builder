'use babel';

module.exports = {
  addInfo: val => atom.notifications.addInfo(val),
  addError: val => atom.notifications.addError(val),
  addSuccess: val => atom.notifications.addSuccess(val)
};
