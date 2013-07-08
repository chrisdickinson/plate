module.exports = function(input, plural) {
  if(plural && typeof plural === 'string') {
    plural = plural.split(',')
  } else {
    plural = 's'
  }

  var val = Number(input)
    , suffix

  suffix = plural[plural.length-1];
  if(val === 1) {
    suffix = plural.length > 1 ? plural[0] : '';    
  }

  return suffix
}
