var http = require('http');
var url = require('url');
var proxy = require('./proxy.js');
var config = require('./server-config.json');

var port = config.port == '' ? process.env.PORT : config.port;

http.createServer(function (req, res) {
    if (req.headers['az-proxy-original-url']) {
        var originalUrl = url.parse(req.headers['az-proxy-original-url']);
        var options = {
            host: originalUrl.host,
            path: originalUrl.pathname,
            method: req.method,
            headers: req.headers
        };

        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end(JSON.stringify({ 'request-header': req.headers, 'send-options': options }, null, 2));

        // var innerRequest = http.request(options, function (innerResponse) {
        //     console.log('[' + innerResponse.statusCode + '] ' + innerResponse.req.path);

        //     res.statusCode = innerResponse.statusCode;
        //     for (var headerName in innerResponse.headers) {
        //         res.setHeader(headerName, innerResponse.headers[headerName]);
        //     }
        //     innerResponse.pipe(res);
        // });
        // innerRequest.on('error', function (error) {
        //     res.writeHead(200, {'Content-Type': 'text/plain'});
        //     res.end('[server] ' + error.toString());
        // });
        // req.pipe(innerRequest);
    }
    else {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('PONG!');
    }
}).listen(port);

console.log('az-proxy server is listening on port ' + port);