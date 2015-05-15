var API = require('./src/api.js');

var setting = [{
    path:'/data',
    data: {
        status: 'success',
        log:['///log*0///','/// info*0 ///'],
        data:{
            active: true,
            metadata: {
                admin:false,
                data:['/// info*0 ///']
            }
        },
    },
    templates:{
        info:{
            media:'photo',
            id:1,
            editable:true,
            message:'this is message'
        },
        log:{
            test:'this is test'
        }
    }
},
{
    path:'/api',
    data: {
        status: 'success',
        log:['///status*500///'],
    },
    templates:{
        status:{
            status:'success',
            amount2:{
                data:function(){
                    return Math.floor(Math.random()*100)
                }
            },
            amount:{
                data:{
                    stub_type:'select',
                    choice:[100,200,300,400],
                    type:'liner' //'liner' /'random_unique'/
                }
            },
            id:{
                stub_type:'number',
                starting_num:100,
                increments:1,
                max_num:8000,
                min_num:1000,
                type:'incremental', //'incremental'
            },
            text:{
                stub_type:'lipsum',
                max_char_length:500,
                min_char_length:200,
            },
            date:{
                stub_type:'datetime',
                output_format:'toUTCString',
                type:'random', //incremental,
                starting_datetime:'2014-01-01',
                increments:86400000,
                max_datetime:'f0',
                min_datetime:'2014-01-01',
            }
        }
    }
}];

var apiserver = new API(setting);
apiserver.start(3000, function(){
    console.log(apiserver.profile.call(this));
});
// apiserver.port()
// apiserver.stop() 