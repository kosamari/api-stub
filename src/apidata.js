var crypto = require('crypto');
var log = require('./message.js');


/*
Make deep copy of passed object.
If function was assigned to a key, invoke the function.
Arg:
  - obj (Array or Object)
Return: clone (Array or Object)
*/
function cloneAndInvoke(obj){
  var clone = Array.isArray(obj) ? [] : {};
  for (var key in obj) {
    if (obj[key] !== null && typeof(obj[key])=="object") {
      clone[key] = cloneAndInvoke(obj[key]);
    }else if(typeof(obj[key])=="function"){
      clone[key] = obj[key]();
    }else{
      clone[key] = obj[key];
    }
  }
  return clone
}

/*
Recursively iterate through each key in object to find template place holder
If ///[templ_name] * [repeat_num]/// is found, add the info to result array
Arg:
  - obj (Array or Object)
  - result(Array)
Return:
  - result (Array): instructions of where/which template/how many to add data
*/
function parseData(obj, result) {
  if(result===undefined){result = [];}
  for (var key in obj) {
    if (obj[key] !== null && typeof(obj[key])=="object") {
      parseData(obj[key], result);
    }else if(Array.isArray(obj) && typeof(obj[key])==='string'){
      var re = /^\/\/\/.*(\*)[0-9]*\/\/\/$/;
      var text = obj[key].split(" ").join("");
      if(re.test(text)){
        result.push({
          location:obj,
          index:key,
          key:text.match(/^\/\/\/.*(\*)/)[0].replace('///','').replace('*',''),
          amount:parseInt(text.match(/\d+\/\/\/$/)[0].replace('///',''),10)
        });
      }
    }
  }
  return result
}


/*
Parse each templates to replace stub instruction with valueGenerator functions
Arg:
  - templates (Array)
Return: templates (Array) stub instruction is replaced with function
*/
function prepareTemplates(templates){
  var valueGeneratorsDict = {
    select: function(obj){
      var types = {
        random:function(){
          return obj.choice[Math.floor(Math.random() * obj.choice.length)];
        },
        liner: function(){
          var el = obj.choice.shift();
          obj.choice.push(el);
          return el;
        },
        random_unique: function(){
          function shuffle(o) {
            for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
            return o;
          };
          if(!obj.randomized){obj.randomized = shuffle(obj.choice.slice());}
          var el = obj.randomized.shift();
          if(el===undefined){
            log.notEnoughChoice('random_unique','choice');
            process.exit()
          }
          return el;
        }
      }
      if(!types[obj.type]){
        return log.noTemplateType('select', obj.type, Object.keys(types))
      }
      return types[obj.type]
    },
    lipsum: function(obj){
      if(!(obj.max_char_length&&obj.min_char_length)){
        return log.missingSettings('lipsum', '', ['max_char_length','mim_char_length'])
      }
      var lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
      return function(){
        var chars = Math.floor(Math.random()*(obj.max_char_length-obj.min_char_length)+obj.min_char_length)
        var str = lorem.slice(0, chars)
        while(str.length < chars){
          var len = chars - str.length
          str += ' '+lorem.slice(0, len)
        }
        return str
      }
    },
    number: function(obj){
      var types = {
        random:function(){
          return Math.floor(Math.random()*(obj.max_num-obj.min_num)+obj.min_num);
        },
        incremental: function(){
          tempdata += obj.increments
          return tempdata;
        }
      }

      if(!types[obj.type]){
        return log.noTemplateType('number', obj.type, Object.keys(types))
      }
      if(obj.type == 'random' && !(obj.max_num&&obj.min_num)){
        return log.missingSettings('number', 'random', ['max_num','min_num'])
      }
      if(obj.type == 'incremental'){
        if(!(obj.starting_num&&obj.increments)){
          return log.missingSettings('number', 'incremental', ['starting_num','increments'])
        }
        var tempdata = this[obj.id] = obj.starting_num - obj.increments
      }

      return types[obj.type]
    },
    datetime: function(obj){
      var types = {
        random:function(){
          return output[obj.output_format](new Date(Math.floor(Math.random()*(max-min)+min)));
        },
        incremental: function(){
          tempdata += obj.increments
          return output[obj.output_format](new Date(tempdata));
        }
      }
      var output = {
        toString: function(d){ return d.toString(); },
        toDateString: function(d){ return d.toDateString(); },
        toISOString: function(d){ return d.toISOString(); },
        toJSON: function(d){ return d.toJSON(); },
        toGMTString: function(d){ return d.toGMTString(); },
        toLocaleDateString: function(d){ return d.toLocaleDateString(); },
        toLocaleString: function(d){ return d.toLocaleString(); },
        toLocaleTimeString: function(d){ return d.toLocaleTimeString(); },
        toTimeString: function(d){ return d.toTimeString(); },
        toUTCString: function(d){ return d.toUTCString(); },
        toYMDString:function(d){
          return d.toJSON().split('T')[0]
        }
      }

      if(!types[obj.type]){
        return log.noTemplateType('date', obj.type, Object.keys(types))
      }
      if(obj.type == 'random'){
        if(!(obj.max_datetime&&obj.min_datetime&&obj.output_format)){
          return log.missingSettings('date', 'random', ['max_datetime','min_datetime','output_format'])
        }
        var min = Date.parse(obj.min_datetime)
        var max = Date.parse(obj.max_datetime)
        if(isNaN(min)){
          return log.notParseableDatetime('min_datetime', obj.min_datetime)
        }else if(isNaN(max)){
          return log.notParseableDatetime('max_datetime', obj.max_datetime)
        }
      }
      if(obj.type == 'incremental'){
        if(!(obj.starting_datetime&&obj.increments&&obj.output_format)){
          return log.missingSettings('number', 'incremental', ['starting_datetime','increments','output_format'])
        }
        var tempdata = this[obj.id] = Date.parse(obj.starting_datetime) - obj.increments
        if(isNaN(tempdata)){
          return log.notParseableDatetime('starting_datetime', obj.starting_datetime)
        }
      }

      return types[obj.type]
    }
  }

  /*
  Recursively iterate each key in template object to find `stub_type` key.
  If the object has `stub_type` key, replace itself with corresponding
  function in valueGenerators valid
  Arg:
    - obj (Object)
  */
  function parseTemplate(obj) {
    for (var key in obj) {
      if (obj[key] !== null && typeof(obj[key])=="object") {
        if(obj[key].stub_type){
          if(!valueGeneratorsDict[obj[key].stub_type]){
            log.stubTypeNotFound(obj[key].stub_type)
          }else{
            obj[key].id = crypto.randomBytes(16).toString('hex');
            obj[key] = valueGeneratorsDict[obj[key].stub_type](obj[key])
          }
        }else{
          parseTemplate(obj[key]);
        }
      }
    }
  }

  if(templates){
    Object.keys(templates).map(function(t){
      parseTemplate(templates[t]);
    })
    return templates;
  }else{
    return [];
  }
}


/*
Make deep copy of template by invoking valueGenerator functions as you copy.
Repeat for instructed amount, and place it in instructed location.
Arg:
  - instruction(Array)
  - templates(Array)
*/
function createResponseData(instruction, templates){
  instruction.map(function(inst){
    if(!templates[inst.key]){return log.templateNotSpecified(inst.key);}
    var data = [];
    for(var j=0;j<inst.amount;j++){
      data.push(cloneAndInvoke(templates[inst.key]));
    }
    inst.location.splice.apply(inst.location, [inst.index, 1].concat(data));
  });
}


/*
APIData constructor
Generates dataset based on templates.
On initialize, it will...
  - Make a deep copy of data object in endpointSettings (apidata)
  - Parse api to find instructions for data generation (instructions)
  - Prepare templates to include valueGenerator functions
  - Manipulate contents of apidata based on instructions and templates

Arguments:
  - config (Object): object with info about the endpoint

Return: Object with access to methods
  - getJSONString(): return stringified version of apidata
*/
function APIData(endpointSettings){
  var apidata = cloneAndInvoke(endpointSettings.data);
  var headers = endpointSettings.headers;
  var instructions = parseData(apidata)
  var templates = prepareTemplates(endpointSettings.templates);

  createResponseData(instructions, templates);

  function getJSONString(){
    return JSON.stringify(apidata);
  }

  return {
    getJSONString: getJSONString,
    headers: headers
  };
}

module.exports = APIData;