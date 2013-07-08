module.exports = function(input, plural) {
  plural = (typeof plural === 'string' ? plural : 's').split(',')

  var val = Number(input)
    , suffix

  suffix = plural[plural.length-1];
  if(val === 1) {
    suffix = plural.length > 1 ? plural[0] : '';    
  }

  return suffix
}
