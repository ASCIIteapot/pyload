function getHumanSize() {
    var arguments_={
        returntype: 'array',
        accuracy: 2,
        standard: 'IEC'
    };
    $.extend(arguments_, arguments[0]);

    var a = arguments_.standard != 'IEC';
    var bytes = arguments_.bytes;

    var res = {
                size: (a = a ? [1e3, 'k', 'B'] : [1024, 'K', 'iB'], b = Math, c = b.log,
                    d = c(bytes) / c(a[0]) | 0, bytes / b.pow(a[0], d)).toFixed(arguments_.accuracy),
                units: (d ? (a[1] + 'MGTPEZY')[--d] + a[2] : 'Bytes')
    };

    return res;
}

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};