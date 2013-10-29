var http = require('http');
var config = require('./config.json');

var port = config.port > 0 ? config.port : process.env.PORT;
var intermediateProxyHost = config.intermediateProxyHost == '' ? null : config.intermediateProxyHost;
var intermediateProxyPort = config.intermediateProxyPort == '' ? null : config.intermediateProxyPort;

http.createServer(function (req, res) {
    console.log('client -> az-proxy: [' + req.method + '] ' + req.url);

    var options = {
        host: intermediateProxyHost || req.headers.host,
        path: req.url,
        method: req.method,
        headers: req.headers
    };
    if (intermediateProxyPort) {
        options.port = intermediateProxyPort;
    }
    if (options.headers['Proxy-Connection']) {
        options.headers['Connection'] = options.headers['Proxy-Connection'];
        delete options.headers['Proxy-Connection'];
    }
    var innerRequest = http.request(options, function (innerResponse) {
        console.log('remote -> az-proxy: [' + innerResponse.statusCode + '] ' + innerResponse.req.path);

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

}).listen(port);

console.log('az-proxy is listening on port ' + port);