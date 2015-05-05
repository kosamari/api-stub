var http = require('http');
var log = require('./message.js');

function createData(opt){
    var dict = {};
    opt.forEach(function(set){
        dict[set.path] = JSON.stringify(cleandata(set));
    });
    return dict;
}

function parseData(obj, trail, result) {
    if(trail===undefined){trail = [];}
    if(result===undefined){result = [];}
    for (var key in obj) {
        if (obj[key] !== null && typeof(obj[key])=="object") {
            trail.push(key);
            parseData(obj[key], trail, result);
        }else if(typeof(obj[key])==='string'){
            var re = /^\/\/\/.*(\*)[0-9]*\/\/\/$/;
            var text = obj[key].split(" ").join("");
            if(re.test(text)){
                trail.push(key);
                result.push({
                    trail:JSON.stringify(trail),
                    key:text.match(/^\/\/\/.*(\*)/)[0].replace('///','').replace('*',''),
                    repeat:parseInt(text.match(/\d+\/\/\/$/)[0].replace('///',''),10)
                });
                trail.length = 0;
            }
        }
    }
    return result;
}


function cleandata(set){
    if(!set.data){return log.dataFieldNotSpecified(set.path);}

    var parseResult = parseData(set.data,[],[]).map(function(d){d.trail = JSON.parse(d.trail);return d;});

    parseResult.forEach(function(r){
        var data = [r.trail[r.trail.length-1],1];
        for (var j=0;j<r.repeat;j++){
            data.push(set[r.key]);
        }
        var temp = set.data;
        for (var i=0;i<r.trail.length-1;i++){
            temp = temp[r.trail[i]];
        }

        temp.splice.apply(temp, data);
    });

   return set.data;
}


function API(opt){
    var portNum;
    var apiStatus = false;
    var startTime;
    var data = createData(opt);
    var server =  http.createServer(function (req, res) {
        if(data[req.url]){
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(data[req.url]);
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
        if(isNaN(port)){ return log.portNotNumber(port);}
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
            running_since: startTime
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
