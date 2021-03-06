angular.module('Collection', []).provider('cj', function () {
  var strictVersion, urlTransform;
  urlTransform = angular.identity;
  strictVersion = true;
  return {
    setUrlTransform: function (transform) {
      return urlTransform = transform;
    },
    setStrictVersion: function (strict) {
      return strictVersion = strict;
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
            return client.parse(res.data);
          }, function (res) {
            return client.parse(res.data).then(function (collection) {
              var e;
              e = new Error('request failed');
              e.response = res;
              e.collection = collection;
              return $q.reject(e);
            });
          });
        };
        client.parse = function (source) {
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
var __slice = [].slice;
angular.module('Collection').service('defineNested', function () {
  var defineNested;
  return defineNested = function (obj, keys, prop) {
    var head, next, tail;
    head = keys[0], tail = 2 <= keys.length ? __slice.call(keys, 1) : [];
    if (!tail.length) {
      return Object.defineProperty(obj, head, prop);
    } else {
      next = obj[head] || (obj[head] = {});
      return defineNested(next, tail, prop);
    }
  };
});
var __slice = [].slice;
angular.module('Collection').service('nameFormatter', function () {
  var notEmpty, _nestedAssign;
  _nestedAssign = function (obj, segments, value) {
    var head, tail;
    head = segments[0], tail = 2 <= segments.length ? __slice.call(segments, 1) : [];
    if (tail.length) {
      obj[head] || (obj[head] = {});
      return _nestedAssign(obj[head], tail, value);
    } else {
      obj[head] = value;
      return obj;
    }
  };
  notEmpty = function (s) {
    return s !== '';
  };
  return {
    bracketedSegments: function (str) {
      if (!angular.isString(str)) {
        return [];
      }
      return str.split(/[\]\[]/).filter(notEmpty);
    },
    dottedSegments: function (str) {
      if (!angular.isString(str)) {
        return [];
      }
      return str.split('.').filter(notEmpty);
    },
    dotted: function (str) {
      var segments;
      if (!angular.isString(str)) {
        return str;
      }
      segments = this.bracketedSegments(str);
      return segments.join('.');
    },
    bracketed: function (str) {
      var i, segments, _i, _ref;
      if (!angular.isString(str)) {
        return str;
      }
      segments = this.dottedSegments(str);
      for (i = _i = 1, _ref = segments.length; 1 <= _ref ? _i < _ref : _i > _ref; i = 1 <= _ref ? ++_i : --_i) {
        segments[i] = '[' + segments[i] + ']';
      }
      return segments.join('');
    },
    _nestedAssign: _nestedAssign
  };
});
angular.module('Collection').factory('ReadonlyCache', function () {
  var ReadonlyCache;
  return ReadonlyCache = function () {
    var noop;
    noop = angular.noop;
    function ReadonlyCache(_inner) {
      this._inner = _inner;
    }
    ReadonlyCache.prototype.get = function (key) {
      return this._inner[key];
    };
    ReadonlyCache.prototype.put = function (key, val) {
      return val;
    };
    ReadonlyCache.prototype.remove = noop;
    ReadonlyCache.prototype.removeAll = noop;
    ReadonlyCache.prototype.destroy = noop;
    ReadonlyCache.prototype.info = function () {
      return {
        id: null,
        size: Object.keys(this._inner).length,
        readonly: true
      };
    };
    return ReadonlyCache;
  }();
});
var __slice = [].slice;
angular.module('Collection').service('sealNested', function () {
  var sealNested;
  return sealNested = function (obj, keys) {
    var head, tail;
    head = keys[0], tail = 2 <= keys.length ? __slice.call(keys, 1) : [];
    if (angular.isObject(obj)) {
      Object.seal(obj);
      return sealNested(obj[head], tail);
    }
  };
});
angular.module('Collection').provider('Collection', function () {
  return {
    $get: [
      'Link',
      'Item',
      'Query',
      'Template',
      'ReadonlyCache',
      '$injector',
      function (Link, Item, Query, Template, ReadonlyCache, $injector) {
        var Collection, buildCache;
        buildCache = function (embedded) {
          var c, embeddedLookup, _i, _len, _ref;
          embeddedLookup = {};
          _ref = embedded || [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            c = _ref[_i];
            if (c.collection) {
              embeddedLookup[c.collection.href] = c;
            }
          }
          return new ReadonlyCache(embeddedLookup);
        };
        return Collection = function () {
          function Collection(collection) {
            this._collection = collection;
            this._links = null;
            this._queries = null;
            this._items = null;
            this._template = null;
            this.error = this._collection.error;
            this.client = $injector.get('cj');
            this._cache = buildCache(this._collection.embedded);
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
                  _results.push(new Link(l, this._cache));
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
                _results.push(new Item(i, template, this._cache));
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
      'nameFormatter',
      function (Link, Template, $injector, nameFormatter) {
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
      'nameFormatter',
      'defineNested',
      'sealNested',
      function ($injector, nameFormatter, defineNested, sealNested) {
        var Template;
        return Template = function () {
          var TemplateDatum;
          function Template(_href, _template, opts) {
            var d, segments, _fn, _i, _j, _len, _len1, _ref, _ref1;
            this._href = _href;
            this._template = _template;
            if (opts == null) {
              opts = {};
            }
            this.client = $injector.get('cj');
            this._data = {};
            this._submitMethod = opts.method || 'POST';
            this.options = {};
            this.prompts = {};
            this.errors = {};
            this.selectedOptions = {};
            this.data = {};
            _ref = this._template.data || [];
            _fn = function (_this) {
              return function () {
                var datum, segments;
                datum = _this._data[d.name] = new TemplateDatum(d);
                segments = nameFormatter.bracketedSegments(d.name);
                defineNested(_this, segments, {
                  enumerable: true,
                  get: function () {
                    return datum.value;
                  },
                  set: function (v) {
                    return datum.value = v;
                  }
                });
                defineNested(_this.options, segments, {
                  get: function () {
                    return datum.options;
                  }
                });
                defineNested(_this.prompts, segments, {
                  get: function () {
                    return datum.prompt;
                  }
                });
                defineNested(_this.errors, segments, {
                  get: function () {
                    return datum.errors;
                  }
                });
                defineNested(_this.selectedOptions, segments, {
                  get: function () {
                    return datum.selectedOptions();
                  },
                  set: function (option) {
                    return datum.value = option != null ? option.value : void 0;
                  }
                });
                return defineNested(_this.data, segments, {
                  enumerable: true,
                  get: function () {
                    return datum;
                  }
                });
              };
            }(this);
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              d = _ref[_i];
              _fn();
            }
            _ref1 = this._template.data || [];
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
              d = _ref1[_j];
              segments = nameFormatter.bracketedSegments(d.name);
            }
          }
          Template.prototype.datum = function (key) {
            var formatted;
            formatted = nameFormatter.bracketed(key);
            return this._data[formatted];
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
          Template.prototype.errorsFor = function (key) {
            var _ref;
            return (_ref = this.datum(key)) != null ? _ref.errors : void 0;
          };
          Template.prototype.optionsFor = function (key, applyConditions) {
            var o, options, _i, _len, _ref, _results;
            if (applyConditions == null) {
              applyConditions = true;
            }
            options = (_ref = this.datum(key)) != null ? _ref.options : void 0;
            if (!applyConditions) {
              return options;
            } else {
              _results = [];
              for (_i = 0, _len = options.length; _i < _len; _i++) {
                o = options[_i];
                if (this.conditionsMatch(o.conditions)) {
                  _results.push(o);
                }
              }
              return _results;
            }
          };
          Template.prototype.conditionsMatch = function (conditions) {
            if (!conditions || !conditions.length) {
              return true;
            }
            return conditions.every(function (_this) {
              return function (c) {
                return _this.get(c.field) === c.value;
              };
            }(this));
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
          Template.prototype.formNested = function () {
            var datum, key, memo, segments, _ref;
            memo = {};
            _ref = this._data;
            for (key in _ref) {
              datum = _ref[key];
              segments = nameFormatter.bracketedSegments(key);
              nameFormatter._nestedAssign.call(this, memo, segments, datum.value);
            }
            return memo;
          };
          Template.prototype.valid = function () {
            var datum, key, _ref;
            _ref = this._data;
            for (key in _ref) {
              datum = _ref[key];
              if (!datum.valid()) {
                return false;
              }
            }
            return true;
          };
          Template.prototype.submit = function () {
            return this.client(this.href(), {
              method: this._submitMethod,
              data: this.parametersNested()
            });
          };
          Template.prototype.refresh = function () {
            return this.client(this.href(), {
              method: 'GET',
              params: this.parameters()
            });
          };
          Template.prototype.parameters = function () {
            var datum, k, result, _ref;
            result = {};
            _ref = this._data;
            for (k in _ref) {
              datum = _ref[k];
              if (datum.template) {
                angular.extend(result, datum.template.parameters());
              } else {
                result[datum.parameter || datum.name] = datum.value;
              }
            }
            return result;
          };
          Template.prototype.parametersNested = function () {
            var key, memo, segments, value, _ref;
            memo = {};
            _ref = this.parameters();
            for (key in _ref) {
              value = _ref[key];
              segments = nameFormatter.bracketedSegments(key);
              nameFormatter._nestedAssign(memo, segments, value);
            }
            return memo;
          };
          TemplateDatum = function () {
            var empty;
            empty = function (str) {
              return !str || str === '';
            };
            function TemplateDatum(_datum) {
              this._datum = _datum;
              this.name = this._datum.name;
              this.parameter = this._datum.parameter;
              this.value = this._datum.value;
              this.prompt = this._datum.prompt;
              this.valueType = this._datum.value_type;
              this.options = this._datum.options || [];
              this.errors = this._datum.errors || [];
              this.validationErrors = [];
              this.template = null;
              if (this._datum.template) {
                this.template = new Template(null, this._datum.template);
              }
            }
            TemplateDatum.prototype.valid = function () {
              var isError, name, _ref;
              this.validationErrors = {
                required: !this.validateRequired(),
                regexp: !this.validateRegexp()
              };
              _ref = this.validationErrors;
              for (name in _ref) {
                isError = _ref[name];
                if (isError) {
                  return false;
                }
              }
              return true;
            };
            TemplateDatum.prototype.validateRequired = function () {
              if (this._datum.required) {
                return !empty(this.value);
              } else {
                return true;
              }
            };
            TemplateDatum.prototype.validateRegexp = function () {
              if (this._datum.regexp) {
                return empty(this.value) || this.value.match(this._datum.regexp);
              } else {
                return true;
              }
            };
            TemplateDatum.prototype.selectedOptions = function () {
              var o, options, _i, _len, _ref, _results;
              if (angular.isArray(this.value)) {
                _ref = this.options;
                _results = [];
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                  o = _ref[_i];
                  if (~this.value.indexOf(o.value)) {
                    _results.push(o);
                  }
                }
                return _results;
              } else {
                options = function () {
                  var _j, _len1, _ref1, _results1;
                  _ref1 = this.options;
                  _results1 = [];
                  for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
                    o = _ref1[_j];
                    if (o.value === this.value) {
                      _results1.push(o);
                    }
                  }
                  return _results1;
                }.call(this);
                return options[0];
              }
            };
            return TemplateDatum;
          }();
          return Template;
        }();
      }
    ]
  };
});