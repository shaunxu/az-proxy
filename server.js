var http = require('http');
var util = require('util');

http.createServer(function (req, res) {
    console.log('client -> node-proxy: [' + req.method + '] ' + req.url);

    var innerRequest = http.request({
        host: '127.0.0.1',
        port: 3128,
        path: req.url,
        method: req.method,
        headers: req.headers
    }, function (innerResponse) {
        console.log('remote -> node-proxy: [' + innerResponse.statusCode + '] ' + innerResponse.req.path);

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

}).listen(12345, '127.0.0.1');

console.log('Server running at http://127.0.0.1:12345/');