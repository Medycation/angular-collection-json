angular.module('Collection', []).provider 'cj', ->
  urlTransform = angular.identity
  strictVersion = true
  successHandler = (s, q, c) -> s
  errorHandler = (e, q, c) -> q.reject e

  setUrlTransform: (_urlTransform) -> urlTransform = _urlTransform
  setStrictVersion: (_strictVersion) -> strictVersion = _strictVersion
  setSuccessHandler: (_successHandler) -> successHandler = _successHandler
  setErrorHandler: (_errorHandler) -> errorHandler = _errorHandler

  $get: (Collection, $http, $q) ->
    
    client = (href, options) ->
      config = angular.extend {url: urlTransform(href)}, options
      $http(config).then(
        (res) ->
          $q.when(successHandler(res, $q, config)).then(
            (s) -> client.handleSuccess s, config
            (e) -> client.handleError e, config
          )

        (res) ->
          $q.when(errorHandler(res, $q, config)).then(
            (s) -> client.handleSuccess s, config
            (e) -> client.handleError e, config
          )
      )

    client.handleSuccess = (res, config) -> client.parse res.data, config

    client.handleError = (res, config) ->
      client.parse(res.data).then (collection) ->
        e = new Error 'request failed'
        e.response = res
        e.collection = collection
        $q.reject e

    client.parse = (source, config) ->

      if !source
        return $q.reject new Error 'source is empty'

      if angular.isString source
        try
          source = JSON.parse source
        catch e
          return $q.reject e

      if !angular.isObject source.collection
        return $q.reject new Error "Source 'collection' is not an object"

      if strictVersion && source.collection?.version isnt "1.0"
        return $q.reject new Error "Collection does not conform to Collection+JSON 1.0 Spec"

      collectionObj = new Collection source.collection

      if collectionObj.error
        e = new Error('Parsed collection contains errors')
        e.collection = collectionObj
        $q.reject e
      else
        $q.when collectionObj

    client
