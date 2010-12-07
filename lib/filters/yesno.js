exports.yesno = function(callback, input, map) {
  var ourMap = map.toString().split(','),
      value;

  ourMap.length < 3 && ourMap.push(ourMap[1]);

  value = ourMap[input ? 0 :
                 input === false ? 1 :
                 2];

  callback(null, value);
};
