module.exports = function(input) {
  var str = input.toString()
  return str.replace(/<[^>]*?>/g, '')
}
