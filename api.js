var http = require('http');
var log = require('./message.js');


function checkFields(endpoint, index){
    var state = true;
    if(!endpoint.path){
        state = false;
        log.pathFieldNotSpecified(index);
    }else if(!endpoint.data){
        state = false;
        log.dataFieldNotSpecified(endpoint.path);
    }
    return state;
}


function processData(obj, result) {
    if(result===undefined){result = [];}
    for (var key in obj) {
        if (obj[key] !== null && typeof(obj[key])=="object") {
            processData(obj[key], result);
        }else if(Array.isArray(obj) && typeof(obj[key])==='string'){
            var re = /^\/\/\/.*(\*)[0-9]*\/\/\/$/;
            var text = obj[key].split(" ").join("");
            if(re.test(text)){
                result.push({
                    location:obj,
                    index:key,
                    key:text.match(/^\/\/\/.*(\*)/)[0].replace('///','').replace('*',''),
                    amount:parseInt(text.match(/\d+\/\/\/$/)[0].replace('///',''),10)
                });
            }
        }
    }
    return result;
}


function createResonseData(instruction,templates){
    instruction.map(function(inst){
        if(!templates[inst.key]){return log.templateNotSpecified(inst.key);}
        var data = [];
        for(var j=0;j<inst.amount;j++){
            data.push(templates[inst.key]);
        }
        inst.location.splice.apply(inst.location, [inst.index, 1].concat(data));
    });
}


function processTemplates(templates){
    return templates;
}


function Endpoint(config){
    var apidata = config.data;
    createResonseData(processData(apidata), processTemplates(config.templates));

    function getJSONString(){
        return JSON.stringify(apidata);
    }

    return {
        getJSONString: getJSONString
    };
}

function API(endpointsConfig){
    var portNum;
    var apiStatus = false;
    var startTime;
    var endpoints = {};
    endpointsConfig.map(function(data,i){
        if(checkFields(data,i)){
            endpoints[data.path] = new Endpoint(data);
        }
    });
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
            if(callback){callback();}
            return;
        });
    }

    function stopAPI(callback){
        server.close(function(){
            apiStatus = false;
            startTime = undefined;
            portNum = undefined;
            if(callback){callback();}
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
