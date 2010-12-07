var utils = require('plate/utils');

var ulparser = function(list) {
  var out = [],
      l = list.slice(),
      item;

  while(l.length) {
    item = l.pop();
    if(item instanceof Array) out.unshift('<ul>'+ulparser(item)+'</ul>');
    else out.unshift('</li><li>'+item);
  }

  // get rid of the leading </li>, if any. add trailing </li>.
  return out.join('').replace(/^<\/li>/, '') + '</li>';
};

exports.unordered_list = function(callback, input) {
  callback(null, input instanceof Array ? new utils.SafeString(ulparser(input)) : input);
};
