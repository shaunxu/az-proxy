var http = require('http');

var tunnel = function (host, port, req, res) {
    var options = {
        host: host || req.headers.host,
        path: req.url,
        method: req.method,
        headers: req.headers
    };
    if (port) {
        options.port = port;
    }
    var innerRequest = http.request(options, function (innerResponse) {
        console.log('[' + innerResponse.statusCode + '] ' + innerResponse.req.path);

        res.statusCode = innerResponse.statusCode;
        for (var headerName in innerResponse.headers) {
            res.setHeader(headerName, innerResponse.headers[headerName]);
        }
        innerResponse.pipe(res);
    });

    innerRequest.on('error', function (error) {
        res.writeHead(500, {'Content-Type': 'text/plain'});
        res.end(error.toString());
    });

    req.pipe(innerRequest);
};

module.exports.tunnel = tunnel;