function err(text){
    console.log('\x1b[31mERR! \x1b[39m '+text);
}
function warning(text){
    console.log('\x1b[33mOOPS \x1b[39m '+text);
}
function success(text){
    console.log('\x1b[32mSUCCESS \x1b[39m '+text);
}

var msg = {
    apiServerStarted :function(port){
        success('server is running on port ' + port);
    },
    apiServerStopped :function(port){
        success('server is running on ' + port +' successfully stopped');
    },
    portNaN : function(port){
        err(port + ' is not a number, try something like 5000 or give 0 to choose landom port');
    },
    portNotDefined : function(){
        err('Could not find port number. try something like 5000 or give 0 to choose landom port');
    },
    portAlreadyUsed : function(port){
        err(port + ' is alreay used by other service, try other numbers');
    },
    apiAlreadyRunning: function(port){
        err('server is alreay running in port ' + port);
    },
    dataFieldNotSpecified: function(path){
        warning('Could not find "data" field for your '+path+' api setting ');
    },
    pathFieldNotSpecified: function(index){
        warning('could not find "path" field in your request '+index);
    },
    templateNotSpecified: function(name){
        warning('Could not find '+name+' template ');
    },
    stubTypeNotFound: function(name){
        warning('Could not find '+name+' type ');
    },
    noTemplateType: function(template, type, types){
        warning('Template ' + template + ' has no type ' + type + ' try '+types.join(' or '))
    },
    notEnoughChoice: function(type, list){
        err('run out of unique choice for '+type+' operation. please give enough elements for '+list)
    },
    notParseableDatetime: function(key, value){
        err('could not parse '+key+' ('+value+') please use JavaScript Date Object parseable string')
    },
    missingSettings: function(template, type, list){
        err(template+' ('+ type+') needs '+list.join(' and ')+'.')
    },
    generalError : function(errorMessage){
        err(errorMessage);
    }
};

module.exports = msg;