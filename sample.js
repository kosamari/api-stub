var API = require('./api.js');

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
        log:['///status*1///'],
    },
    templates:{
        status:{
            status:'success',
            amount:{
                data:{
                    stub_type:'select',
                    choice:[100,200,300,400],
                    type:'random' //'liner'
                }
            },
            id:{
                stub_type:'unique_num',
                starting_num:100,
                increments:10,
                max_num:8000,
                min_num:1000,
                type:'incremental', //'random'
            },
            text:{
                stub_type:'lipsum',
                max_char_length:100,
            },
            date:{
                stub_type:'date',
                template:'Y-M-D',
                type:'random', //incremental,
                starting_date:'2014-01-01',
                increments:1,
                max_date:'2014-01-01',
                min_date:'2014-01-31',
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
