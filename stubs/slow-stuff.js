module.exports = [{
  path: '/slow',
  data: {
    slow: true
  }
  ,delay: {
    min: 200,
    max: 500
  }
},{
  path: '/reallyslow',
  data: {
    reallyslow: true
  }
  ,delay: {
    min: 2000,
    max: 2000
  }
}];