exports.iteritems = function(callback, input) {
  var output = [];
  for(var name in input) if(input.hasOwnProperty(name)) {
    output.push([name, input[name]]);
  }
  callback(null, output);
};
