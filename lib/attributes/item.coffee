angular.module('Collection').provider('Item', ->
  $get: (Link, Template, $injector) ->
    class Item
      constructor: (@_item, @_template, @_cache)->
        # delay the dependency
        @client = $injector.get 'cj'
        @_links = null

      href: ()-> @_item.href

      datum: (key)->
        for i in @_item.data
          return angular.extend({}, i) if i.name == key

      get: (key)->
        @datum(key)?.value

      fields: ->
        memo = {}
        for item in @_item.data
          segments = nameFormatter.bracketedSegments item.name
          nameFormatter._nestedAssign.call @, memo, segments, item.value
        memo

      related: ->
        @_item.related

      promptFor: (key)->
        @datum(key)?.prompt

      load: ->
        @client @href()

      links: (rel)->

        if !@_links
          @_links = (new Link l, @_cache for l in (@_item.links || []))

        if !rel
          return @_links
        else
          rel = [rel] if typeof rel == 'string'
          return (l for l in (@_links || []) when rel.indexOf(l.rel()) > -1)

      link: (rel)->
        for l in @links()
          return l if l.rel() == rel

      edit: (ns)->
        return unless @_template
        template = new Template @href(), @_template, method: 'PUT'
        #TODO: This is a hack and should die
        for datum in @_item.data
          template.set (if ns then "#{ns}[#{datum.name}]" else datum.name), datum.value
        template

      remove: ()->
        @client @href(), method: 'DELETE'

)
