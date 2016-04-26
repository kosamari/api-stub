'use strict';

// const API = require('./src/api');
const API = process.env.NODE_ENV === 'docker' ? require('./src/api') : require('api-stub');

var config = {
  proxy: 'http://ecsb-dev.kroger.com',
  // stubsPath: process.cwd() + '/stubs2',
  endpoints: [
    {
      path: '/data',
      data: {
        data: true
      }
    },
    {
      path: '/broken',
      data: {},
      errorRate: 1
    }
  ]
};

var apiserver = new API(config);

apiserver.start(3002, function () {
  console.log(apiserver.profile.call(this));
});
