//namespace for this widget massCreateLeads

window.massCreateLeads = {};
window.massCreateLeads.init = [];
window.massCreateLeads.settings = [];
window.massCreateLeads.onSave = [];

window.massCreateLeads.execute = function (event, widget) {
  var result = true;
  for (var i = 0; i < window.massCreateLeads[event].length; i++) {
    if (result) {
      result = result && window.massCreateLeads[event][i](widget);
    }
  }
  return result;
};

window.massCreateLeads.sourceUrl = 'https://localproduct.local.dv/public/';
window.massCreateLeads.renderHref = '';
window.massCreateLeads.renderBasePath = '';
// window.massCreateLeads.apiUrl = 'https://localproduct.local.dv'
// window.massCreateLeads.storageUrl = 'https://massCreateLeads.local.dv/storage';

define([
  'jquery',
  'lib/components/base/modal',
  'css!' +
    window.massCreateLeads.sourceUrl +
    '/css/app.css?cache=' +
    Date.now(),
  window.massCreateLeads.sourceUrl + 'js/render.js?cache=' + Date.now(),
  window.massCreateLeads.sourceUrl + 'js/store.js?cache=' + Date.now(),
  window.massCreateLeads.sourceUrl + 'js/action.js?cache=' + Date.now(),
  window.massCreateLeads.sourceUrl + 'js/main.js?cache=' + Date.now(),
], function ($) {
  var CustomWidget = function () {
    var self = this;
    this.callbacks = {
      render: function () {
        return true;
      },
      init: function () {
        return window.massCreateLeads.execute('init', self);
      },
      bind_actions: function () {
        return true;
      },
      settings: function () {
        return true;
      },
      onSave: function () {
        return true;
      },
      destroy: function () {
        return true;
      },
    };
    return this;
  };

  return CustomWidget;
});
