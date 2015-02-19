describe "Client", ->
  provider = $injector = scope = null

  validMessage = '{"collection":{"version":"1.0"}}'
  invalidMessage = '{}'

  beforeEach module('Collection')

  beforeEach ->
    angular.module('test.client.provider', []).config (cjProvider) ->
      provider = cjProvider
    module('test.client.provider')

  beforeEach inject (_$injector_, $rootScope) ->
    $injector = _$injector_
    scope = $rootScope.$new()

  describe "strictVersion", ->
    it 'does not reject invalid version if strictVersion is off', ->
      provider.setStrictVersion false
      spy = jasmine.createSpy 'reject'
      client = $injector.invoke provider.$get
      client.parse(collection: items: []).catch spy
      scope.$digest()
      expect(spy).not.toHaveBeenCalled()

    it 'still rejects if collection is missing', ->
      provider.setStrictVersion false
      spy = jasmine.createSpy 'reject'
      client = $injector.invoke provider.$get
      client.parse(notacollection: true).catch spy
      scope.$digest()
      expect(spy).toHaveBeenCalled()

  describe "urlTransform", ->
    $httpBackend = null

    beforeEach inject (_$httpBackend_, _$injector_) ->
      $httpBackend = _$httpBackend_

    it 'makes calls with transformed url', ->
      $httpBackend.expectGET('http://example.com/cool').respond(200, validMessage)
      provider.setUrlTransform (orig) ->
        orig + '/cool'

      client = $injector.invoke provider.$get 
      expect(client).toBeDefined()
      client 'http://example.com'
      $httpBackend.verifyNoOutstandingExpectation()

  describe "setSuccessHandler", ->
    $httpBackend = null

    beforeEach inject (_$httpBackend_, _$injector_) ->
      $httpBackend = _$httpBackend_

    it 'overwrites the default successHandler', ->

      spied = {
        successHandler: (res, q) -> 
          d = q.defer()
          d.resolve res
          d.promise
      }

      spyOn(spied, 'successHandler').andCallThrough()


      provider.setSuccessHandler spied.successHandler

      client = $injector.invoke provider.$get 

      $httpBackend.expectGET('http://example.com').respond(200, validMessage)
      client('http://example.com')
      $httpBackend.flush()
      scope.$apply()
      
      expect(spied.successHandler).toHaveBeenCalled()

    it 'works with promises', ->

      successHandler = (res, q) ->
        d = q.defer()
        d.resolve res
        d.promise

      provider.setSuccessHandler successHandler

      successSpy = jasmine.createSpy 'success'
      errorSpy = jasmine.createSpy 'error'

      client = $injector.invoke provider.$get 

      $httpBackend.expectGET('http://example.com').respond(200, validMessage)
      client('http://example.com').then successSpy, errorSpy
      $httpBackend.flush()
      scope.$apply()

      expect(successSpy).toHaveBeenCalled()
      expect(errorSpy).not.toHaveBeenCalled()

    it 'even works with plain objects', ->

      successHandler = (res, q) ->
        res

      provider.setSuccessHandler successHandler

      successSpy = jasmine.createSpy 'success'
      errorSpy = jasmine.createSpy 'error'

      client = $injector.invoke provider.$get 

      $httpBackend.expectGET('http://example.com').respond(200, validMessage)
      client('http://example.com').then successSpy, errorSpy
      $httpBackend.flush()
      scope.$apply()

      expect(successSpy).toHaveBeenCalled()
      expect(errorSpy).not.toHaveBeenCalled()

    it 'can be used to reject the message', ->

      successHandler = (res, q) -> 
        q.reject res

      successSpy = jasmine.createSpy 'success'
      errorSpy = jasmine.createSpy 'error'

      provider.setSuccessHandler successHandler

      client = $injector.invoke provider.$get 

      $httpBackend.expectGET('http://example.com').respond(200, validMessage)
      client('http://example.com').then successSpy, errorSpy

      $httpBackend.flush()
      scope.$apply()

      expect(successSpy).not.toHaveBeenCalled()
      expect(errorSpy).toHaveBeenCalled()



  describe "setErrorHandler", ->
    $httpBackend = null

    beforeEach inject (_$httpBackend_, _$injector_) ->
      $httpBackend = _$httpBackend_

    it 'overwrites the default errorHandler', ->

      spied = {
        errorHandler: (res, q) -> q.reject res
      }

      spyOn(spied, 'errorHandler').andCallThrough()


      provider.setErrorHandler spied.errorHandler

      client = $injector.invoke provider.$get 

      $httpBackend.expectGET('http://example.com').respond(400, validMessage)
      client('http://example.com')
      $httpBackend.flush()
      scope.$apply()
      
      expect(spied.errorHandler).toHaveBeenCalled()

    it 'propagates the reject', ->
  
      errorHandler =  (res, q) -> q.reject res

      successSpy = jasmine.createSpy 'success'
      errorSpy = jasmine.createSpy 'error'

      provider.setErrorHandler errorHandler

      client = $injector.invoke provider.$get 

      $httpBackend.expectGET('http://example.com').respond(400, validMessage)
      client('http://example.com').then successSpy, errorSpy
      $httpBackend.flush()
      scope.$apply()
      
      expect(successSpy).not.toHaveBeenCalled()
      expect(errorSpy).toHaveBeenCalled()

    it 'but can be resolved into a success', ->
  
      errorHandler =  (res, q) ->
        d = q.defer()
        d.resolve res
        d.promise

      successSpy = jasmine.createSpy 'success'
      errorSpy = jasmine.createSpy 'error'

      provider.setErrorHandler errorHandler

      client = $injector.invoke provider.$get 

      $httpBackend.expectGET('http://example.com').respond(400, validMessage)
      client('http://example.com').then successSpy, errorSpy
      $httpBackend.flush()
      scope.$apply()
      
      expect(successSpy).toHaveBeenCalled()
      expect(errorSpy).not.toHaveBeenCalled()








