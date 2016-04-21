var http = require('http');
var log = require('./message.js');
var APIData = require('./apidata.js');
var util = require('util');
var request = require('request');
var url = require('url');
var fs = require('fs');

function flatten(arr) {
  return arr.reduce(function (flat, toFlatten) {
    return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
  }, []);
}

function scanForStubs(path, endpointsConfig) {
  var cfg = util.isArray(endpointsConfig) ?
      JSON.parse(JSON.stringify(endpointsConfig)) : [];

  try {
    return flatten(cfg.concat(fs.readdirSync(path)
        .filter(function (file) {
          return file.substr(-3) === '.js';
        })
        .map(function (item) {
          return require(path + '/' + item);
        })));
  }
  catch (e) {
    return cfg;
  }
}

function proxyRequest(proxyUrl, req, res) {
  var options = {
    uri: proxyUrl + req.url,
    headers: req.headers
  };

  options.headers['host'] = url.parse(options.uri).host;

  var r = null;

  if (req.method === 'POST') {
    options.json = req.body;
    r = request.post(options);
  } else {
    r = request(options);
  }

  req.pipe(r).pipe(res);
}

/*
 Check if setting object passed from API constructor
 has minimum information to run api. (path & data)
 Arg:
 - endpointSetting (Object)
 - index (Number)
 Return: state (Boolean)
 */
function verifyEndpointSettings(endpointSettings, index) {
  var state = true;
  if (!endpointSettings.path) {
    state = false;
    log.pathFieldNotSpecified(index);
  } else if (!endpointSettings.data) {
    state = false;
    log.dataFieldNotSpecified(endpointSettings.path);
  }
  return state;
}

function addHeaders(response, headers) {
  if (headers) {
    headers.forEach(function (header) {
      response.setHeader(header.name, header.value);
    });
  }
}

/*
 API constructor
 On initialize, it will...
 - parse through each endpoint setting to create a dataset
 - create http server

 Arguments:
 - config (Array): array of endpoint setting objects
 - or
 - config (Object): object with 2 properties, defaultHeaders (array of header name value) and endpoints (array of endpoint setting objects)

 Return: Object with access to methods
 - start(port number, [callback]): start http server on specified port number
 - stop([callback]): stop http server
 - profile(): send status of the API
 Return:
 - status(Boolean) : True if http server is running
 - port(Number) : port number that http sever is using,
 - running_since(DateTime): time the http server started,
 - path(Array) : list of paths that is set for this API
 */
function API(config) {
  if (!config) {
    log.generalError('config is undefined');
  }

  var portNum;
  var apiStatus = false;
  var startTime;
  var endpoints = {};
  var defaultHeaders = [];

  const proxy = config.proxy;
  const stubsPath = config.stubsPath || process.cwd() + '/stubs';
  const endpointsConfig = scanForStubs(stubsPath, config.endpoints);

  // Parse endpointsConfig and create Endpoint object for each path
  endpointsConfig.forEach(function (endpointSettings, i) {
    if (verifyEndpointSettings(endpointSettings, i)) {
      endpoints[endpointSettings.path] = new APIData(endpointSettings);
    }
  });

  // Set default headers
  if (config.hasOwnProperty('defaultHeaders')) {
    defaultHeaders = config.defaultHeaders;
  }

  // Create http server
  var server = http.createServer(function (req, res) {
    if (!endpoints[req.url]) {
      if (proxy) {
        log.requestProxied(req.url);
        proxyRequest(proxy, req, res);
        return;
      }

      log.unknownPath(req.url);
      res.writeHead(404, {'Content-Type': 'text/plain'});
      res.end('No Data Specified here');
      return;
    }

    if (endpoints[req.url].isError()) {
      res.writeHead(500, {'Content-Type': 'text/plain'});
      res.end('Error generated based on settings');
      return;
    }

    // start the response
    addHeaders(res, defaultHeaders);
    addHeaders(res, endpoints[req.url].headers);
    res.writeHead(200, {'Content-Type': 'application/json'});

    var delay = endpoints[req.url].getDelay();

    if (!delay) {
      res.end(endpoints[req.url].getJSONString());
      return;
    }

    setTimeout(function () {
      res.end(endpoints[req.url].getJSONString());
    }, delay);
  });

  server.on('error', function (e) {
    if (e.code == 'EADDRINUSE') {
      return log.portAlreadyUsed(portNum);
    }
    return log.generalError(e);
  });

  function startAPI(port, callback) {
    if (apiStatus === true) {
      return log.apiAlreadyRunning(portNum);
    }
    if (port === undefined) {
      return log.portNotDefined();
    }
    if (isNaN(port)) {
      return log.portNaN(port);
    }
    portNum = port;
    server.listen(port, null, null, function () {
      apiStatus = true;
      startTime = new Date();
      portNum = server.address().port;
      log.apiServerStarted(portNum);
      if (callback) {
        callback(true);
      }
    });
  }

  function stopAPI(callback) {
    server.close(function () {
      log.apiServerStopped(portNum);
      apiStatus = false;
      startTime = undefined;
      portNum = undefined;
      if (callback) {
        callback(true);
      }
    });
  }

  function profile() {
    return {
      status: apiStatus,
      port: portNum,
      running_since: startTime,
      path: Object.keys(endpoints)
    };
  }

  // public API
  return {
    start: startAPI,
    stop: stopAPI,
    profile: profile
  };
}

module.exports = API;
