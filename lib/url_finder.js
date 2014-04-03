module.exports = function(input, callback) {
  var str = input.toString()
  return str.replace(/(((http(s)?:\/\/)|(mailto:))([\w\d\-\.:@\/?&=%])+)/g, callback)
}