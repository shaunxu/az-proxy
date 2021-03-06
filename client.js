var http = require('http');
var proxy = require('./proxy.js');
var config = require('./client-config.json');

var port = config.port == '' ? process.env.PORT : config.port;
var enterpriseProxyHost = config.enterpriseProxyHost == '' ? null : config.enterpriseProxyHost;
var enterpriseProxyPort = config.enterpriseProxyPort == '' ? null : config.enterpriseProxyPort;

var getProxy = function (proxies) {
    var length = proxies.length;
    var proxy = '';
    if (length > 1) {
        var pos = Math.floor(Math.random() * length);
        proxy = proxies[pos];
    }
    else {
        proxy = proxies[0];
    }
    return 'http://' + proxy;
};

http.createServer(function (req, res) {
    // console.log(JSON.stringify({ 'request-header': req.headers }, null, 2));
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
        options.port = enterpriseProxyPort;
    }
    // move the original request url into header 'az-proxy-original-url'
    // so that in the server side it will retrieve the original url and send request
    options.headers['az-proxy-original-headers'] = JSON.stringify(req.headers);
    options.headers['az-proxy-original-url'] = req.url;
    // console.log(JSON.stringify({ 'send-options': options }, null, 2));
    // build inner request to send to the az proxy server
    var innerRequest = http.request(options, function (innerResponse) {
        console.log('[' + innerResponse.statusCode + '] ' + req.url);

        res.statusCode = innerResponse.statusCode;
        for (var headerName in innerResponse.headers) {
            res.setHeader(headerName, innerResponse.headers[headerName]);
        }
        innerResponse.pipe(res);
    });

    innerRequest.on('error', function (error) {
        res.writeHead(500, {'Content-Type': 'text/plain'});
        res.end('[client] ' + error.toString());
    });

    req.pipe(innerRequest);
}).on('connect', function (req, socket, head) {

}).listen(port);

console.log('az-proxy client is listening on port ' + port);