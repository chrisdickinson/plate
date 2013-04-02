module.exports = function(input, by, ready) {
  by = arguments.length === 2 ? ',' : by
  input = ''+input
  return input.split(by)
}
