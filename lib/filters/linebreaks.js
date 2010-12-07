var utils = require('plate/utils');

exports.linebreaks = function(callback, input) {
  var str = input.toString(),
      paras = str.split('\n\n'),
      out = [];

  while(paras.length) {
    out.unshift(paras.pop().replace(/\n/g, '<br />'));
  }
  callback(null, new utils.SafeString('<p>'+out.join('</p><p>')+'</p>')); 
};
