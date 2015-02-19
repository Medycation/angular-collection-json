describe "[template](http://amundsen.com/media-types/collection/format/#objects-template)", ->
  cj = collection = data = null

  beforeEach module('Collection')

  beforeEach inject (_cj_, $rootScope, cjOriginal)->
    cj = _cj_
    data = cjOriginal
    cj.parse(data).then((c) -> collection = c)
    $rootScope.$digest()

  it "returns undefined when a template was not set", ->
    delete collection._collection.template
    expect(collection.template()).toBeUndefined()


  it "should iterate properties template", ->
    template = collection.template()
    for key, value of template.form()
      orig = _.find data.collection.template.data, (datum)-> datum.name is key
      expect(key).toEqual orig.name
      expect(value).toEqual orig.value
      expect(template.promptFor(key)).toEqual orig.prompt

  it "should be able to set values", ->
    newItem = collection.template()
    name = "Joe Test"
    email = "test@test.com"
    blog = "joe.blogger.com"
    avatar = "http://www.gravatar.com/avatar/dafd213c94afdd64f9dc4fa92f9710ea?s=512"

    newItem.set "full-name", name
    newItem.set "email", email
    newItem.set "blog", blog
    newItem.set "avatar", avatar

    expect(newItem.get("full-name")).toEqual name
    expect(newItem.get("email")).toEqual email
    expect(newItem.get("blog")).toEqual blog
    expect(newItem.get("avatar")).toEqual avatar

  it "should return a datum given a name", ->
    newItem = collection.template()
    fullName = newItem.datum("full-name")
    expect(fullName.name).toEqual "full-name"
    expect(fullName.prompt).toEqual "Full Name"
    expect(fullName.value).toEqual "Joe"

  it "should create a form from set values", ->
    blog = "joe.blogger.com"
    email = "test@test.com"
    newItem = collection.template()

    newItem.set 'blog', blog
    newItem.set 'email', email
    form = newItem.form()
    expect(form.blog).toEqual blog
    expect(form.email).toEqual email

  it "should format the template well", ->

    newItem = collection.template()

    parsed = JSON.parse newItem.serializeData()

    expect(parsed).toEqual( 
      {
        "template": {
          "data": [
            {"name": "full-name", "value": "Joe"},
            {"name": "email", "value": ""},
            {"name": "blog", "value": ""},
            {"name": "avatar", "value": ""},
            {"name": "address[city]", "value": ""}
          ]}
      })
