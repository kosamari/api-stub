var API = require('api-stub');

var setting = [{
    path:'/data',
    data: {
        status: 'success',
        data:['///item*10///'],
        log:['///log*10///']
    },
    templates:{
        item:{
            random_amount:function(){
              return Math.floor(Math.random())
            },
            amount:{
                data:{
                    stub_type:'select',
                    choice:[100,200,300,400],
                    type:'liner'
                }
            },
            id:{
                stub_type:'number',
                max_num:8000,
                min_num:1000,
                type:'random'
            },
            text:{
                stub_type:'lipsum',
                min_char_length:100,
                max_char_length:300,
            },
            date:{
                stub_type:'datetime',
                output_format:'toYMDString',
                type:'incremental',
                starting_datetime:'2014-01-01',
                increments:86400000
            }
        },
        log:{
            message:'message'
        }
    }
}];

var apiserver = new API(setting);
apiserver.start(3000, function(){
    console.log(apiserver.profile.call(this));
});