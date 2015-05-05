var API = require('./api.js');


var setting = [{
    path:'/data',
    data: {
        status: 'success',
        log:['///log*5///'],
        data:{
            active: true,
            metadata: {
                admin:false,
                data:['/// info*10 ///']
            }
        },
    },
    lipsum:{
        info: true,
        log: false
    },
    info:{
        media:'photo',
        id:1,
        editable:true,
        message:'this is message'
    },
    log:{
        test:'this is test'
    }
},
{
    path:'/api',
    data: {
        status: 'success',
        log:['///status*5///'],
    },
    status:{
        amount:100,
        id:1
    }
}]

var apiserver = new API(setting)
apiserver.start(3000)
// console.log(apiserver.profile())
// apiserver.start(3000,function(err, message){
//     if(err) conaole.log(err);
// })
// apiserver.port()
// apiserver.stop()
// apiserver.restart(setting)
