import os
import sys
import re


files = [
  'lib/utils.js',
  'lib/eterator.js',
  'lib/nodes.js',
  'lib/tags/block.js',
  'lib/tags/extends.js',
  'lib/tags/for.js',
  'lib/tags/if.js',
  'lib/tags/include.js',
  'lib/tags/now.js',
  'lib/tags/with.js',
  'lib/tags/comment.js',
  'lib/filters/add.js',
  'lib/filters/addslashes.js',
  'lib/filters/capfirst.js',
  'lib/filters/center.js',
  'lib/filters/cut.js',
  'lib/filters/date.js',
  'lib/filters/default.js',
  'lib/filters/dictsort.js',
  'lib/filters/dictsortreversed.js',
  'lib/filters/divisibleby.js',
  'lib/filters/escape.js',
  'lib/filters/force_escape.js',
  'lib/filters/filesizeformat.js',
  'lib/filters/first.js',
  'lib/filters/floatformat.js',
  'lib/filters/get_digit.js',
  'lib/filters/index.js',
  'lib/filters/iteritems.js',
  'lib/filters/iriencode.js',
  'lib/filters/join.js',
  'lib/filters/last.js',
  'lib/filters/length.js',
  'lib/filters/length_is.js',
  'lib/filters/linebreaks.js',
  'lib/filters/linebreaksbr.js',
  'lib/filters/linenumbers.js',
  'lib/filters/ljust.js',
  'lib/filters/lower.js',
  'lib/filters/make_list.js',
  'lib/filters/phone2numeric.js',
  'lib/filters/pluralize.js',
  'lib/filters/random.js',
  'lib/filters/rjust.js',
  'lib/filters/safe.js',
  'lib/filters/slice.js',
  'lib/filters/slugify.js',
  'lib/filters/striptags.js',
  'lib/filters/title.js',
  'lib/filters/timesince.js',
  'lib/filters/timeuntil.js',
  'lib/filters/truncatewords.js',
  'lib/filters/truncatechars.js',
  'lib/filters/unordered_list.js',
  'lib/filters/upper.js',
  'lib/filters/urlencode.js',
  'lib/filters/urlize.js',
  'lib/filters/urlizetrunc.js',
  'lib/filters/wordcount.js',
  'lib/filters/wordwrap.js',
  'lib/filters/yesno.js',
  'lib/libraries.js',
  'lib/parsers.js',
  'lib/tokens.js',
  'lib/index.js',
]

template = """
(function() {
    var get_exports = function(file) {
        var where = window,
            what = file == 'index' ? [] : file.split('/'),
            incoming;
        what.unshift('plate');
        while(what.length) {
            incoming = what.shift();
            if(!where[incoming]) {
                where[incoming] = {};
            }
            where = where[incoming];
        }
        return where;
    };

    %s
})();
"""

def fix_reserved(string):
    problems = [reserved for reserved in ['with', 'for', 'if', 'extends', 'default'] if reserved in string]
    if problems:
        for problem in problems:
            string = string.replace(problem, '_%s'%problem)
    return string

def build(target):
    f = open(target, 'w')

    cwd = os.getcwd()

    regex = re.compile(r'require\(\'(?P<path>[\w\/\.\d]+)\'\)', re.MULTILINE)
    output = []
    for file in files:
        base_dir = os.path.dirname(file)
        file_handle = open(file, 'r')
        data = file_handle.read()
        file_handle.close()

        def replace_path(match):
            path = match.groupdict()['path']
            path = os.path.realpath(os.path.join(base_dir, path)).replace(cwd, '')
            path = fix_reserved(path)
            objpath = path[1:].replace('/', '.')
            if objpath == 'lib':
                objpath = 'plate'

            return (objpath and [objpath.replace('lib.', 'plate.')] or ['plate'])[0]

        data = regex.sub(replace_path, data)
        file = fix_reserved(file.replace('lib/', '').replace('.js', ''))
        data = '(function(exports){%s})(get_exports("%s"));' % (data, file)
        output.append(data)

    f.write(template % '\n'.join(output))
    f.close()
    print 'built plate.js'

if __name__ == '__main__':
    build(sys.argv[-1])
