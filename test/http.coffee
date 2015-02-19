describe "HTTP Requests", ->
  beforeEach module('Collection')

  cj = scope = $httpBackend = data = errorData = null
  cjUrl = "http://example.com/collection.json"
  cjErrorUrl = "http://example.com/error.json"


  beforeEach inject (_cj_, _$httpBackend_, cjOriginal, cjError, $rootScope) ->
    cj = _cj_
    data = cjOriginal
    errorData = cjError
    $httpBackend = _$httpBackend_
    $httpBackend.whenGET(cjUrl).respond data
    $httpBackend.whenGET(cjErrorUrl).respond 401, errorData
    scope = $rootScope.$new()

  it "should parse", ->
    result = null
    cj(cjUrl).then (collection) -> result = collection
    $httpBackend.flush()
    scope.$apply()
    expect(result.version()).toEqual data.collection.version

  it "should invoke error callback on failure", ->
    result = null
    cj(cjErrorUrl).catch (error) -> result = error
    $httpBackend.flush()
    expect(result.collection.version()).toEqual data.collection.version

  it "should follow links with new collections", ->
    result = null
    cj(cjUrl).then (collection) -> result = collection
    $httpBackend.flush()
    for orig in data.collection.links
      link = result.link orig.rel
      $httpBackend.whenGET(link.href()).respond data
      link.follow().then (collection) ->
        expect(collection.version()).toEqual data.collection.version
    $httpBackend.flush()

  it "should refresh with the same collection", ->
    result = null
    cj(cjUrl).then (collection) -> result = collection
    $httpBackend.flush()
    $httpBackend.whenGET(result.href()).respond data
    result.refresh().then (collection) ->
      expect(collection.version()).toEqual data.collection.version
    $httpBackend.flush()

  it "should respond to query requests with new collections", ->
    result = null
    cj(cjUrl).then (collection) -> result = collection
    $httpBackend.flush()
    for orig in data.collection.queries
      query = result.query orig.rel
      $httpBackend.whenGET(new RegExp(query.href())).respond data
      query.refresh().then (collection) ->
        expect(collection.version()).toEqual data.collection.version
    $httpBackend.flush()

  it "should respond to query submits with new collections", ->
    result = null
    cj(cjUrl).then (collection) -> result = collection
    $httpBackend.flush()
    for orig in data.collection.queries
      query = result.query orig.rel
      $httpBackend.whenPOST(new RegExp(query.href())).respond data
      query.submit().then (collection) ->
        expect(collection.version()).toEqual data.collection.version
    $httpBackend.flush()

  it "should respond to template submissions with new collections", ->
    result = null
    cj(cjUrl).then (collection) -> result = collection
    $httpBackend.flush()
    template = result.template()
    $httpBackend.whenPOST(template.href()).respond data
    template.submit().then (collection) ->
      expect(collection.version()).toEqual data.collection.version
    $httpBackend.flush()

  it "should load items with new collections", ->
    result = null
    cj(cjUrl).then (collection) -> result = collection
    $httpBackend.flush()
    for orig in data.collection.items
      item = result.item orig.href
      $httpBackend.whenGET(item.href()).respond data
      item.load().then (collection) ->
        expect(collection.version()).toEqual data.collection.version
    $httpBackend.flush()

  it "should remove a collection", ->
    result = null
    cj(cjUrl).then (collection) -> result = collection
    $httpBackend.flush()
    $httpBackend.expectDELETE(result.href())
    $httpBackend.whenDELETE(result.href()).respond()
    result.remove()
    $httpBackend.flush()

  it "should delete items with new collections", ->
    result = null
    cj(cjUrl).then (collection) -> result = collection
    $httpBackend.flush()
    for orig in data.collection.items
      item = result.item orig.href
      $httpBackend.whenDELETE(item.href()).respond data
      item.remove().then (collection) ->
        expect(collection.version()).toEqual data.collection.version
    $httpBackend.flush()

  it "should PUT when editing an item", ->
    result = null
    cj(cjUrl).then (collection) -> result = collection
    $httpBackend.flush()
    for orig in data.collection.items
      item = result.item orig.href
      template = item.edit()
      $httpBackend.whenPUT(template.href()).respond template.form(true)
      template.submit().then (response) ->
        expect(response).toEqual template.form(true)
    $httpBackend.flush()

  it "should GET with template when running refresh() method", ->
    result = null
    cj(cjUrl).then (collection) -> result = collection
    $httpBackend.flush()
    for orig in data.collection.items
      item = result.item orig.href
      template = item.edit()
      $httpBackend.whenGET(new RegExp(template.href())).respond data
      template.refresh().then (response) ->
        expect(response.version()).toEqual data.collection.version

    $httpBackend.flush()
