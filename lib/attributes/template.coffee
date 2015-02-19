angular.module('Collection').provider('Template', ->
  $get: ($injector) ->
    class Template
      constructor: (@_href, @_template, opts = {})->
        # delay the dependency
        @client = $injector.get 'cj'

        @_data = {}
        @_submitMethod = opts.method || 'POST'

        for d in (@_template.data || []) then do =>
          @_data[d.name] = new TemplateDatum d

      datum: (key)->
        @_data[key]

      get: (key)->
        @datum(key)?.value

      set: (key, value)->
        @datum(key)?.value = value

      promptFor: (key)->
        @datum(key)?.prompt

      href: ->
        @_href

      form: ->
        memo = {}
        memo[key] = datum.value for key, datum of @_data
        memo

      submit: ->
        @client @href(), method: @_submitMethod, data: @serializeData()

      refresh: ->
        @client @href(), method: 'GET'

      serializeData: ->
        data = [];
        for key, value of @form()
          obj = { name: key, value: value }
          data.push obj
        JSON.stringify { template: { data : data } }

      class TemplateDatum
        empty = (str) ->
          !str || str == ""

        constructor: (@_datum) ->
          @name = @_datum.name
          @value = @_datum.value
          @prompt = @_datum.prompt

)
