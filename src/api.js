var http = require('http');
var log = require('./message.js');
var APIData = require('./apidata.js');
var util = require('util');

/*
Check if setting object passed from API constructor
has minimum information to run api. (path & data)
Arg:
  - endpintSetting (Object)
  - index (Number)
Return: state (Boolean)
*/
function verifyEndpointSettings(endpointSettings, index){
  var state = true;
  if(!endpointSettings.path){
    state = false;
    log.pathFieldNotSpecified(index);
  }else if(!endpointSettings.data){
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
function API(config){
  var portNum;
  var apiStatus = false;
  var startTime;
  var endpoints = {};
  var defaultHeaders = [];
  var that = this;

  var endpointsConfig;
  if (util.isArray(config)) {
    endpointsConfig = config;
  } else {
    endpointsConfig = config.endpoints;
  }

  // Parse endpointsConfig and create Endpoint object for each path
  endpointsConfig.map(function(endpointSettings, i){
    if(verifyEndpointSettings(endpointSettings, i)){
      endpoints[endpointSettings.path] = new APIData(endpointSettings);
    }
  });

  // Set default headers
  if (config.hasOwnProperty('defaultHeaders')) {
    defaultHeaders = config.defaultHeaders;
  }

    // Create http server
  var server =  http.createServer(function (req, res) {
    if(endpoints[req.url]){
      addHeaders(res, defaultHeaders);
      addHeaders(res, endpoints[req.url].headers);
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(endpoints[req.url].getJSONString());
    } else {
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('No Data Specified here');
    }
  });

  server.on('error', function(e){
    if (e.code == 'EADDRINUSE') {
      return log.portAlreadyUsed(portNum);
    }
    return log.generalError(e);
  });

  function startAPI(port, callback){
    if(apiStatus === true){return log.apiAlreadyRunning(portNum);}
    if(port === undefined){ return log.portNotDefined();}
    if(isNaN(port)){ return log.portNaN(port);}
    portNum = port;
    server.listen(port,null,null,function(){
      apiStatus = true;
      startTime = new Date();
      portNum = server.address().port;
      log.apiServerStarted(portNum);
      if(callback){callback(true);}
      return;
    });
  }

  function stopAPI(callback){
    server.close(function(){
      log.apiServerStopped(portNum);
      apiStatus = false;
      startTime = undefined;
      portNum = undefined;
      if(callback){callback(true);}
      return;
    });
  }

  function profile(){
    return {
      status : apiStatus,
      port : portNum,
      running_since: startTime,
      path : Object.keys(endpoints)
    };
  }

  // public API
  return {
    start: startAPI,
    stop: stopAPI,
    profile : profile,
  };
}

module.exports = API;
