angular.module('Collection').service('cjError',function(){
  var original = { "collection": {
    "version": "1.0",
    "href": "http://example.org/friends/",

    "error": {
      "title": "Server Error",
      "code": "X1C2",
      "message": "The server have encountered an error, please wait and try again."
    }
  }
  }

  return JSON.parse(JSON.stringify(original));
})
