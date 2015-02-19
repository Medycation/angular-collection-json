angular.module('Collection').provider('Collection', ->
  $get: (Link, Item, Query, Template, $injector) ->

    class Collection
      constructor: (collection, options = {})->
        @_collection = collection
        @_links = null
        @_queries = null
        @_items = null
        @_template = null
        @error = @_collection.error
        # delay the dependency
        @client = $injector.get 'cj'

      href: ->
        @_collection.href

      version: ->
        @_collection.version

      links: (rel)->
        return @_links if @_links

        @_links = (new Link l for l in (@_collection.links || []) when !rel || l.rel == rel)

      link: (rel)->
        for l in @links()
          return l if l.rel() == rel

      items: ->
        return @_items if @_items
        template = @_collection.template

        @_items = (new Item(i, template) for i in (@_collection.items || []))

      item: (href)->
        for i in @items()
          return i if i.href() == href

      queries: ->
        new Query q for q in (@_collection.queries || [])

      query: (rel)->
        for q in @_collection.queries || []
          return new Query q if q.rel == rel

      template: ->
        return unless @_collection.template
        new Template @_collection.href, @_collection.template

      templateAll: (ns)->
        item.edit(ns) for item in @items()

      meta: (name)->
        @_collection.meta?[name]

      remove: ->
        @client @href(), method: 'DELETE'

      refresh: ->
        @client @href(), method: 'GET'
)
