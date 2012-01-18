exports.time = function(callback, input, value) {
    """Formats a time according to the given format."""
    if (value === null)
        value = 'H:M:S';
    callback(null, time_format(input, value));
}

