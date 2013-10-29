var http = require('http');
var proxy = require('./proxy.js');
var config = require('./client-config.json');

var port = config.port == '' ? process.env.PORT : config.port;
var enterpriseProxyHost = config.enterpriseProxyHost == '' ? null : config.enterpriseProxyHost;
var enterpriseProxyPort = config.enterpriseProxyPort == '' ? null : config.enterpriseProxyPort;

var getProxy = function (proxies) {
    var length = proxies.length;
    if (length > 1) {
        var pos = Math.floor(Math.random() * length);
        return proxies[pos];
    }
    else {
        return proxies[0];
    }
};

http.createServer(function (req, res) {
    if (req.url == '/') {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('PONG!');
    }
    else {
        // random select a proxy (host) from configuration proxy list
        var proxy = getProxy(config.azProxies);
        var options = {
            // if we have enterprise proxy we need to set that address to request host
            // otherwise set the az proxy to request host
            host: enterpriseProxyHost || proxy,
            // copy the az proxy url into request path
            path: proxy,
            method: req.method,
            headers: req.headers
        };
        // if we have enterprise proxy with port we need to set that port to request port
        // otherwise no need to set the port
        if (enterpriseProxyPort) {
            options.port = port;
        }
        // move the original request url into header 'az-proxy-original-url'
        // so that in the server side it will retrieve the original url and send request
        options.headers['az-proxy-original-url'] = req.url;
        // build inner request to send to the az proxy server
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
    }
}).listen(port);

console.log('az-proxy is listening on port ' + port);