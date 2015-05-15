var http = require('http');
var log = require('./message.js');
var APIData = require('./apidata.js')

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

/*
API constructor
On initialize, it will...
    - parse through each endpoint setting to create a dataset
    - create http server

Arguments:
    - endpintsConfig (Array): array of endpoint setting objects

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
function API(endpointsConfig){
    var portNum;
    var apiStatus = false;
    var startTime;
    var endpoints = {};
    var that = this
    // Parse endpointsConfig and create Endpoint object for each path
    endpointsConfig.map(function(endpointSettings, i){
        if(verifyEndpointSettings(endpointSettings, i)){
            endpoints[endpointSettings.path] = new APIData(endpointSettings);
        }
    });

    // Create http server
    var server =  http.createServer(function (req, res) {
        if(endpoints[req.url]){
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(endpoints[req.url].getJSONString());
        }
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('No Data Specified here');
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
