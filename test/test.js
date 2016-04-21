var assert = require('assert');
var API = require('../src/api.js');
var APIData = require('../src/apidata.js');

var endpointSetting = {
  path: '/data',
  data: {
    log: ['/// log*10 ///']
  },
  templates: {
    log: {
      id: {
        stub_type: 'number',
        min_num: 100,
        max_num: 500,
        type: 'random',
      },
      amount: {
        stub_type: 'select',
        choice: [100, 200, 300, 400],
        type: 'random'
      },
      text: {
        stub_type: 'lipsum',
        min_char_length: 100,
        max_char_length: 300,
      },
      date: {
        stub_type: 'datetime',
        output_format: 'toYMDString',
        type: 'random',
        max_datetime: '2014-01-01',
        min_datetime: '2014-01-01',
      }
    }
  }
}

//test API server
var apiserver = new API([]);
apiserver.start(3000, function (success) {
  assert(success == true, 'Start server')
  apiserver.stop(function (success) {
    assert(success == true, 'Stop server')
  });
});

//test API data
var data = new APIData(endpointSetting)
var dataObj = JSON.parse(data.getJSONString())
assert(dataObj.log.length == 10, 'length')
assert(dataObj.log[0].id <= 500, 'max_num')
assert(dataObj.log[0].id >= 100, 'min_num')
assert([100, 200, 300, 400].indexOf(dataObj.log[0].amount) != -1, 'select')
assert(typeof(dataObj.log[0].text) == 'string', 'string')
assert(dataObj.log[0].date == '2014-01-01', 'date')

endpointSetting = {
  path: 'fast',
  data: {fast: true}
};

data = new APIData(endpointSetting);
assert.equal(data.getDelay(), undefined);

endpointSetting = {
  path: 'slow',
  data: {fast: false},
  delay: {min: 200, max: 200}
};

data = new APIData(endpointSetting);
assert(data.getDelay() === 200);

endpointSetting = {
  path: 'rnd',
  data: {fast: false},
  delay: {min: 50, max: 1000}
};

data = new APIData(endpointSetting);

for (var i = 0; i < 1000; i++){
  var delay = data.getDelay();
  assert(delay >= endpointSetting.delay.min);
  assert(delay <= endpointSetting.delay.max);
}
