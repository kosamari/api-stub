function err(text){
    console.log('\x1b[31mERR! \x1b[39m '+text)
}
function success(text){
    console.log('\x1b[32mSUCCESS \x1b[39m '+text)
}

var msg = {
    apiServerStarted :function(port){
        success('server is running on port ' + port)
    },
    portNotNumber : function(port){
        err(port + ' is not a number, try something like 5000')
    },
    portNotDefined : function(){
        err('Could not find port number. check out ->')
    },
    portAlreadyUsed : function(port){
        err(port + ' is alreay used by other service, try other numbers')
    },
    apiAlreadyRunning: function(port){
        err('server is alreay running in port ' + port)
    },
    dataFieldNotSpecified: function(path){
        err('Could not find "data" field for your '+path+' api setting ')
    },
    generalError : function(errorMessage){
        err(errorMessage)
    }
}

module.exports = msg;