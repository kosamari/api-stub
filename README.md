# API Stub
[![Build Status](https://travis-ci.org/kosamari/api-stub.svg)](https://travis-ci.org/kosamari/api-stub)  
Simple, no database, temporary API for your prototype.

## What is it ?
API Stub is a node.js based API server for prototyping. Idea was simple, sometimes I wanted to work on frontend app before I finish my backend API, or I often needed dummy data when testing out new data visualization designs. I've been using large JSON document as data stub, but I wanted something more quick to modify both schema and size of dataset.

## Getting started
You will need node.js installed on your machine.
```
npm install api-stub --save-dev
```
```javascript
// api.js
var API = require('api-stub');
var config = [{
  path:'/status',
  data: {status: true}
}]
var server = new API(config);
server.start(3000);
//then run the script `node api.js`

```
After you run the script - `node api.js`, http://localhost:3000/status will return following.
```json
{ "status": true }
```
You can put as many endpoints as you like in config array.

## Repeated dataset
If you need repeated dataset, you can specifying `template` field, and use placeholder text in `data` to set repeated amount.
```
var config = [{
  path:'/random',
  data: [/// info * 3 ///] // [templatename] * [how many to repeat]
  templates:{
    info:{
      message:'Hi there!'
    }
  }
}]
```
```json
[{ "message": "Hi there!" },{ "message": "Hi there!" },{ "message": "Hi there!" }]
```

## Dynamically generate data
### Built in templates
There are few built in templates to generate data dynamically. (Check Templates section for more)
```
var config = [{
  path:'/id',
  data: [/// users * 3 ///]
  templates:{
    users:{
      id:{
        stub_type:'number',
        starting_num:1000,
        increments:1,
        type:'incremental'
      },
    }
  }
}]
```
```json
[{ "id": 1000 },{ "id": 1001 },{ "id": 1002 }]
```
### Custom functions
You can also assign your custom function to any key. When initializing API server, API Stub will creates deep copy of `data` & invoke any function assigned.
```
var config = [{
  path:'/random',
  data: {value: function(){Math.random();}}
}]

```
```json
{ "value": 0.05823205946944654 } // random value everytime you start the serer
```

## API
###server.start(port, [callback])
Start API server on specified port number
###server.stop([callback])
Stop API server
###server.profile()
Returns status of the API server
- status: True if API server is running
- port: port number that API sever is using,
- running_since: timestamp of when the API server started,
- path : list of paths this API server is serving
```
{
  status: true,
  port: 3000,
  running_since: Fri May 15 2015 08:29:21 GMT-0400 (EDT),
  path: [ '/data', '/status' ]
}
```

## Templates
There are 4 `stub_type` .

### select
Select values from given choice.

property | type | value
--- | --- | ---
type | `string` | 'liner', 'random', or 'random_unique'
choice | `array` | array of choices
'liner' will select values from top the the array. 'random' will pick values randomly. 'random_unique' will pick values randomly but will _not_　draw same value twice (must provide enough choices if you are creating repeated dataset).
```
data:{
  stub_type:'select',
  type:'liner',
  choice:[100,200,300,400]
}
```

### number
Numbers in set increments or randomly within specified range

property | type | value
--- | --- | ---
type | `string` | 'incremental' or 'random'
starting_num | `number` | starting value for 'incremental' type
increments | `number` | increment step for 'incremental' type
min_num | `number` | minimum value for 'random' type
max_num | `number` | maximum value for 'random' type
'incremental' will inclement values specified in `increments`. 'random' will pick random values between min_num and max_num.
```
id:{
  stub_type:'number',
  type:'incremental',
  starting_num:1000,
  increments:1
}
```
```
value:{
  stub_type:'number',
  type:'random',
  min_num:1000,
  max_num:5000
}
```

### lipsum
Lorem Ipsum text

property | type | value
--- | --- | ---
min_char_length | `number` | minimum character count
max_char_length | `number` | maximum character count

```
text:{
  stub_type:'lipsum',
  min_char_length:200,
  max_char_length:500,
}
```

### datetime
parse & create datetime related text

property | type | value
--- | --- | ---
type | `string` | 'incremental' or 'random'
starting_datetime | `string` | starting value for 'incremental' type. Pass any string that `Date.parse(str)` can process
increments| `string` | increments for 'incremental' type in milliseconds (`86400000` would be one day)
min_datetime | `string` | minimum date for 'random'. Pass any string that `Date.parse(str)` can process
max_datetime | `string` | maximum date for 'random'. Pass any string that `Date.parse(str)` can process
output_format | `string` | parsing method for Date object (see output_format table below)

```
timestamp:{
  stub_type:'datetime',
  type:'random',
  min_datetime:'2014-01-01',
  max_datetime:'2014-01-31',
  output_format:'toYMDString',
}
```
```
timestamp:{
  stub_type:'date',
  type:'incremental',
  starting_datetime:'2014-01-01',
  increments:86400000,
  output_format:'toTimeString',
}
```

output_format| return
--- | ---
toString | `Fri May 15 2015 09:30:16 GMT-0400 (EDT)`
toDateString | `Fri May 15 2015'`
toISOString | `2015-05-15T13:30:16.411Z`
toJSON | `2015-05-15T13:30:16.411Z`
toGMTString | `Fri, 15 May 2015 13:30:16 GMT`
toLocaleDateString | `5/15/2015`
toLocaleString | `5/15/2015, 9:30:16 AM`
toLocaleTimeString | `9:30:16 AM'`
toTimeString | `09:30:16 GMT-0400 (EDT)'`
toUTCString | `Fri, 15 May 2015 13:30:16 GMT`
toYMDString | `2015-05-15`


## FAQ
### Yet another API mock up tool huh?
Yep. I needed something I can generate unique data easily, quickly modify schema as I go, and avoid set up of database.

### Why there is no <_some feature_ > ?
I have been using this script as part of my dataviz prototyping. While this serves my purpose in what I do, I have not been using it for other applications (i.e consumer app). If you find some key features are missing, I'd love to hear about it.


