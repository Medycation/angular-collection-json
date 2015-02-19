# Collection+JSON Client for AngularJS
[![Build Status](https://travis-ci.org/szdavid92/angular-collection-json.svg?branch=master)](https://travis-ci.org/szdavid92/angular-collection-json)

Documentation will be finished once the API is solidified.

## Features

* Simple API
* Browser compatible(IE 8+)
* Ties into AngularJS $q promises
* Query/Template building


## Example

### Get then list users, and add an address

```js
var cj = $injector.get('cj');

// Start at the root of our api
cj("http://example.com").then(function(collection){

  // We get back a collection object
  // Let's follow the 'users' link
  collection.link('users').follow().then(function(collection){

    // Print out the current users
    console.log(collection.items());

    // Lets get a list of addresses from the first user we got back
    collection.items()[0].link('addresses').follow().then(function(collection){

      // Let's add a new address from the template
      var template = collection.template();
      template.set('street', '123 Fake Street');

      // Submit our new template
      template.submit().then(function(collection){
          console.log("Added a new address!!!");
      }, function(error){
          console.log("Something went wrong");
      });
    });
  });
});
```

### Edit an existing user

```js
var cj = $injector.get('cj');

// Start at the root of our api
cj("http://example.com").then(function(collection){

  // We get back a collection object
  // Let's follow the 'users' link
  collection.link('users').follow().then(function(collection){

    // Print out the current users
    console.log(collection.items());

    // Edit the first user
    user0 = collection.items()[0].edit()

    user0.firstName = "Billy";
    user0.lastName = "Jones";
    // PUT the user to save
    user0.submit().then(function(collection){
        console.log("Updated the user!!!");
    }, function(error){
        console.log("Something went wrong");
    });

  });
});
```

## Configuration

```js
angular.module('myApp', ['cj']).configure(function(cjProvider){

  // Alter urls before they get requested
  // cj('http://example.com/foo') requests http://example.com/foo/improved
  cjProvider.setUrlTransform(function(original){
    return original + '/improved';
  });

  // Disable strict version checking (collections without version "1.0")
  cjProvider.setStrictVersion(false);

  // A handler can be added upon successful http request,
  // which is invoked before processing the template
  cjProvider.setSuccessHandler(function(response, q, config){

    //follow redirect on 201 - created
    if (res.status == 201){
      redirect = res.headers('Location');
      if(!redirect) {
        return q.reject(new Error("Http status is 201, but Location header not set"));
      }
      else {
        return client(redirect, config);
      }
    }

    //return success and empty collection on 204 - no content
    else if (res.status == 204) {
      collectionObj = new Collection({"version":"1.0"});
      return $q.when(collectionObj);
    }
    
  });
  
  // A handler can be added upon failed http request,
  // which is invoked before processing the template
  cjProvider.setErrorHandler(function(response, q, config){
    return q.reject(response);
  });

});
```
