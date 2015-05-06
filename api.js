var http = require('http');
var crypto = require('crypto');
var log = require('./message.js');


function generateId(){
    return crypto.randomBytes(16).toString('hex')
}

function shuffle(o) {
    for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

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
    return result
}

function cloneAndInvoke(obj){
    // make deep copy of obj
    // if function(that means it's template generator !) invoke the function.
    var clone = Array.isArray(obj) ? [] : {};
    for (var key in obj) {
        if (obj[key] !== null && typeof(obj[key])=="object") {
            clone[key] = cloneAndInvoke(obj[key]);
        }else if(typeof(obj[key])=="function"){
            clone[key] = obj[key]();
        }else{
            clone[key] = obj[key];
        }
    }
    return clone
}

function createResonseData(instruction,templates){
    instruction.map(function(inst){
        if(!templates[inst.key]){return log.templateNotSpecified(inst.key);}
        var data = [];
        for(var j=0;j<inst.amount;j++){
            data.push(cloneAndInvoke(templates[inst.key]));
        }
        inst.location.splice.apply(inst.location, [inst.index, 1].concat(data));
    });
}

function processTemplates(templates){

    function parseTemplate(obj) {
        for (var key in obj) {
            if (obj[key] !== null && typeof(obj[key])=="object") {
                if(obj[key].stub_type){
                    if(!tDict[obj[key].stub_type]){
                        log.stubTypeNotFound(obj[key].stub_type)
                    }else{
                        obj[key].id = generateId();
                        obj[key] = tDict[obj[key].stub_type](obj[key])
                    }
                }else{
                    parseTemplate(obj[key]);
                }
            }
        }
    }

    Object.keys(templates).map(function(t){
        parseTemplate(templates[t]);
    })
    return templates;
}

var tDict = {
    select: function(obj){
        var type = {
            random:function(){
                return obj.choice[Math.floor(Math.random() * obj.choice.length)];
            },
            liner: function(){
                var el = obj.choice.shift();
                obj.choice.push(el);
                return el;
            },
            random_unique: function(){
                if(!obj.randomized){obj.randomized = shuffle(obj.choice.slice());}
                var el = obj.randomized.shift();
                if(el===undefined){
                    log.notEnoughChoice('random_unique','choice');
                    process.exit()
                }
                return el;
            }
        }
        if(!type[obj.type]){ return log.noTemplateType('select', obj.type, Object.keys(type))}
        return type[obj.type]
    },
    lipsum: function(obj){
        return obj
    },
    unique_num: function(obj){
        return obj
    },
    date: function(obj){
        return obj
    }
}

function Endpoint(config){
    var apidata = cloneAndInvoke(config.data);
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
