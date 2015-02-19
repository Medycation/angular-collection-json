angular.module('Collection', []).provider('cj', function () {
  var errorHandler, strictVersion, successHandler, urlTransform;
  urlTransform = angular.identity;
  strictVersion = true;
  successHandler = function (s, q, c) {
    return s;
  };
  errorHandler = function (e, q, c) {
    return q.reject(e);
  };
  return {
    setUrlTransform: function (_urlTransform) {
      return urlTransform = _urlTransform;
    },
    setStrictVersion: function (_strictVersion) {
      return strictVersion = _strictVersion;
    },
    setSuccessHandler: function (_successHandler) {
      return successHandler = _successHandler;
    },
    setErrorHandler: function (_errorHandler) {
      return errorHandler = _errorHandler;
    },
    $get: [
      'Collection',
      '$http',
      '$q',
      function (Collection, $http, $q) {
        var client;
        client = function (href, options) {
          var config;
          config = angular.extend({ url: urlTransform(href) }, options);
          return $http(config).then(function (res) {
            return $q.when(successHandler(res, $q, config)).then(function (s) {
              return client.handleSuccess(s, config);
            }, function (e) {
              return client.handleError(e, config);
            });
          }, function (res) {
            return $q.when(errorHandler(res, $q, config)).then(function (s) {
              return client.handleSuccess(s, config);
            }, function (e) {
              return client.handleError(e, config);
            });
          });
        };
        client.handleSuccess = function (res, config) {
          return client.parse(res.data, config);
        };
        client.handleError = function (res, config) {
          return client.parse(res.data).then(function (collection) {
            var e;
            e = new Error('request failed');
            e.response = res;
            e.collection = collection;
            return $q.reject(e);
          });
        };
        client.parse = function (source, config) {
          var collectionObj, e, _ref;
          if (!source) {
            return $q.reject(new Error('source is empty'));
          }
          if (angular.isString(source)) {
            try {
              source = JSON.parse(source);
            } catch (_error) {
              e = _error;
              return $q.reject(e);
            }
          }
          if (!angular.isObject(source.collection)) {
            return $q.reject(new Error('Source \'collection\' is not an object'));
          }
          if (strictVersion && ((_ref = source.collection) != null ? _ref.version : void 0) !== '1.0') {
            return $q.reject(new Error('Collection does not conform to Collection+JSON 1.0 Spec'));
          }
          collectionObj = new Collection(source.collection);
          if (collectionObj.error) {
            e = new Error('Parsed collection contains errors');
            e.collection = collectionObj;
            return $q.reject(e);
          } else {
            return $q.when(collectionObj);
          }
        };
        return client;
      }
    ]
  };
});
angular.module('Collection').provider('Collection', function () {
  return {
    $get: [
      'Link',
      'Item',
      'Query',
      'Template',
      '$injector',
      function (Link, Item, Query, Template, $injector) {
        var Collection;
        return Collection = function () {
          function Collection(collection, options) {
            if (options == null) {
              options = {};
            }
            this._collection = collection;
            this._links = null;
            this._queries = null;
            this._items = null;
            this._template = null;
            this.error = this._collection.error;
            this.client = $injector.get('cj');
          }
          Collection.prototype.href = function () {
            return this._collection.href;
          };
          Collection.prototype.version = function () {
            return this._collection.version;
          };
          Collection.prototype.links = function (rel) {
            var l;
            if (this._links) {
              return this._links;
            }
            return this._links = function () {
              var _i, _len, _ref, _results;
              _ref = this._collection.links || [];
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                l = _ref[_i];
                if (!rel || l.rel === rel) {
                  _results.push(new Link(l));
                }
              }
              return _results;
            }.call(this);
          };
          Collection.prototype.link = function (rel) {
            var l, _i, _len, _ref;
            _ref = this.links();
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              l = _ref[_i];
              if (l.rel() === rel) {
                return l;
              }
            }
          };
          Collection.prototype.items = function () {
            var i, template;
            if (this._items) {
              return this._items;
            }
            template = this._collection.template;
            return this._items = function () {
              var _i, _len, _ref, _results;
              _ref = this._collection.items || [];
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                i = _ref[_i];
                _results.push(new Item(i, template));
              }
              return _results;
            }.call(this);
          };
          Collection.prototype.item = function (href) {
            var i, _i, _len, _ref;
            _ref = this.items();
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              i = _ref[_i];
              if (i.href() === href) {
                return i;
              }
            }
          };
          Collection.prototype.queries = function () {
            var q, _i, _len, _ref, _results;
            _ref = this._collection.queries || [];
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              q = _ref[_i];
              _results.push(new Query(q));
            }
            return _results;
          };
          Collection.prototype.query = function (rel) {
            var q, _i, _len, _ref;
            _ref = this._collection.queries || [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              q = _ref[_i];
              if (q.rel === rel) {
                return new Query(q);
              }
            }
          };
          Collection.prototype.template = function () {
            if (!this._collection.template) {
              return;
            }
            return new Template(this._collection.href, this._collection.template);
          };
          Collection.prototype.templateAll = function (ns) {
            var item, _i, _len, _ref, _results;
            _ref = this.items();
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              item = _ref[_i];
              _results.push(item.edit(ns));
            }
            return _results;
          };
          Collection.prototype.meta = function (name) {
            var _ref;
            return (_ref = this._collection.meta) != null ? _ref[name] : void 0;
          };
          Collection.prototype.remove = function () {
            return this.client(this.href(), { method: 'DELETE' });
          };
          Collection.prototype.refresh = function () {
            return this.client(this.href(), { method: 'GET' });
          };
          return Collection;
        }();
      }
    ]
  };
});
angular.module('Collection').provider('Item', function () {
  return {
    $get: [
      'Link',
      'Template',
      '$injector',
      function (Link, Template, $injector) {
        var Item;
        return Item = function () {
          function Item(_item, _template, _cache) {
            this._item = _item;
            this._template = _template;
            this._cache = _cache;
            this.client = $injector.get('cj');
            this._links = null;
          }
          Item.prototype.href = function () {
            return this._item.href;
          };
          Item.prototype.datum = function (key) {
            var i, _i, _len, _ref;
            _ref = this._item.data;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              i = _ref[_i];
              if (i.name === key) {
                return angular.extend({}, i);
              }
            }
          };
          Item.prototype.get = function (key) {
            var _ref;
            return (_ref = this.datum(key)) != null ? _ref.value : void 0;
          };
          Item.prototype.fields = function () {
            var item, memo, segments, _i, _len, _ref;
            memo = {};
            _ref = this._item.data;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              item = _ref[_i];
              segments = nameFormatter.bracketedSegments(item.name);
              nameFormatter._nestedAssign.call(this, memo, segments, item.value);
            }
            return memo;
          };
          Item.prototype.related = function () {
            return this._item.related;
          };
          Item.prototype.promptFor = function (key) {
            var _ref;
            return (_ref = this.datum(key)) != null ? _ref.prompt : void 0;
          };
          Item.prototype.load = function () {
            return this.client(this.href());
          };
          Item.prototype.links = function (rel) {
            var l;
            if (!this._links) {
              this._links = function () {
                var _i, _len, _ref, _results;
                _ref = this._item.links || [];
                _results = [];
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                  l = _ref[_i];
                  _results.push(new Link(l, this._cache));
                }
                return _results;
              }.call(this);
            }
            if (!rel) {
              return this._links;
            } else {
              if (typeof rel === 'string') {
                rel = [rel];
              }
              return function () {
                var _i, _len, _ref, _results;
                _ref = this._links || [];
                _results = [];
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                  l = _ref[_i];
                  if (rel.indexOf(l.rel()) > -1) {
                    _results.push(l);
                  }
                }
                return _results;
              }.call(this);
            }
          };
          Item.prototype.link = function (rel) {
            var l, _i, _len, _ref;
            _ref = this.links();
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              l = _ref[_i];
              if (l.rel() === rel) {
                return l;
              }
            }
          };
          Item.prototype.edit = function (ns) {
            var datum, template, _i, _len, _ref;
            if (!this._template) {
              return;
            }
            template = new Template(this.href(), this._template, { method: 'PUT' });
            _ref = this._item.data;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              datum = _ref[_i];
              template.set(ns ? '' + ns + '[' + datum.name + ']' : datum.name, datum.value);
            }
            return template;
          };
          Item.prototype.remove = function () {
            return this.client(this.href(), { method: 'DELETE' });
          };
          return Item;
        }();
      }
    ]
  };
});
angular.module('Collection').provider('Link', function () {
  return {
    $get: [
      '$injector',
      function ($injector) {
        var Link;
        return Link = function () {
          function Link(_link, _cache) {
            this._link = _link;
            this._cache = _cache;
            this.client = $injector.get('cj');
          }
          Link.prototype.href = function () {
            return this._link.href;
          };
          Link.prototype.rel = function () {
            return this._link.rel;
          };
          Link.prototype.prompt = function () {
            return this._link.prompt;
          };
          Link.prototype.name = function () {
            return this._link.name;
          };
          Link.prototype.follow = function (options) {
            options = angular.extend({ cache: this._cache }, options);
            return this.client(this.href(), options);
          };
          return Link;
        }();
      }
    ]
  };
});
angular.module('Collection').provider('Query', function () {
  return {
    $get: [
      '$injector',
      'Template',
      function ($injector, Template) {
        var Query;
        return Query = function () {
          function Query(_query) {
            this._query = _query;
            this.client = $injector.get('cj');
            this.template = new Template(this._query.href, this._query);
          }
          Query.prototype.datum = function (key) {
            var d, _i, _len, _ref;
            _ref = this._query.data || [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              d = _ref[_i];
              if (d.name === key) {
                return angular.extend({}, d);
              }
            }
          };
          Query.prototype.get = function (key) {
            return this.template.get(key);
          };
          Query.prototype.set = function (key, value) {
            return this.template.set(key, value);
          };
          Query.prototype.promptFor = function (key) {
            var _ref;
            return (_ref = this.datum(key)) != null ? _ref.prompt : void 0;
          };
          Query.prototype.href = function () {
            return this._query.href;
          };
          Query.prototype.rel = function () {
            return this._query.rel;
          };
          Query.prototype.prompt = function () {
            return this._query.prompt;
          };
          Query.prototype.submit = function () {
            return this.template.submit();
          };
          Query.prototype.refresh = function () {
            return this.template.refresh();
          };
          return Query;
        }();
      }
    ]
  };
});
angular.module('Collection').provider('Template', function () {
  return {
    $get: [
      '$injector',
      function ($injector) {
        var Template;
        return Template = function () {
          var TemplateDatum;
          function Template(_href, _template, opts) {
            var d, _fn, _i, _len, _ref;
            this._href = _href;
            this._template = _template;
            if (opts == null) {
              opts = {};
            }
            this.client = $injector.get('cj');
            this._data = {};
            this._submitMethod = opts.method || 'POST';
            _ref = this._template.data || [];
            _fn = function (_this) {
              return function () {
                return _this._data[d.name] = new TemplateDatum(d);
              };
            }(this);
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              d = _ref[_i];
              _fn();
            }
          }
          Template.prototype.datum = function (key) {
            return this._data[key];
          };
          Template.prototype.get = function (key) {
            var _ref;
            return (_ref = this.datum(key)) != null ? _ref.value : void 0;
          };
          Template.prototype.set = function (key, value) {
            var _ref;
            return (_ref = this.datum(key)) != null ? _ref.value = value : void 0;
          };
          Template.prototype.promptFor = function (key) {
            var _ref;
            return (_ref = this.datum(key)) != null ? _ref.prompt : void 0;
          };
          Template.prototype.href = function () {
            return this._href;
          };
          Template.prototype.form = function () {
            var datum, key, memo, _ref;
            memo = {};
            _ref = this._data;
            for (key in _ref) {
              datum = _ref[key];
              memo[key] = datum.value;
            }
            return memo;
          };
          Template.prototype.submit = function () {
            return this.client(this.href(), {
              method: this._submitMethod,
              data: this.serializeData()
            });
          };
          Template.prototype.refresh = function () {
            return this.client(this.href(), { method: 'GET' });
          };
          Template.prototype.serializeData = function () {
            var data, key, obj, value, _ref;
            data = [];
            _ref = this.form();
            for (key in _ref) {
              value = _ref[key];
              obj = {
                name: key,
                value: value
              };
              data.push(obj);
            }
            return JSON.stringify({ template: { data: data } });
          };
          TemplateDatum = function () {
            var empty;
            empty = function (str) {
              return !str || str === '';
            };
            function TemplateDatum(_datum) {
              this._datum = _datum;
              this.name = this._datum.name;
              this.value = this._datum.value;
              this.prompt = this._datum.prompt;
            }
            return TemplateDatum;
          }();
          return Template;
        }();
      }
    ]
  };
});