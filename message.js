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
    generalError : function(errorMessage){
        err(errorMessage);
    }
};

module.exports = msg;
