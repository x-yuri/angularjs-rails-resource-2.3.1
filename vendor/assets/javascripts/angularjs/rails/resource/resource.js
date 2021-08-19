(function (undefined) {
    angular.module('rails').factory('railsRootWrapper', function () {
        return {
            wrap: function (data, resource) {
                var result = {};
                result[angular.isArray(data) ? resource.config.pluralName : resource.config.name] = data;
                return result;
            },
            unwrap: function (response, resource, isObject) {
                if (response.data && response.data.hasOwnProperty(resource.config.name)) {
                    response.data = response.data[resource.config.name];
                } else if (response.data && response.data.hasOwnProperty(resource.config.pluralName) && !isObject) {
                    response.data = response.data[resource.config.pluralName];
                }

                return response;
            }
        };
    });

    angular.module('rails').provider('RailsResource', function () {
        var defaultOptions = {
            rootWrapping: true,
            updateMethod: 'put',
            httpConfig: {},
            defaultParams: undefined,
            underscoreParams: true,
            fullResponse: false,
            singular: false,
            extensions: []
        };

        /**
         * Enables or disables root wrapping by default for RailsResources
         * Defaults to true.
         * @param {boolean} value true to enable root wrapping, false to disable
         * @returns {RailsResourceProvider} The provider instance
         */
        this.rootWrapping = function (value) {
            defaultOptions.rootWrapping = value;
            return this;
        };

        /**
         * Configures what HTTP operation should be used for update by default for RailsResources.
         * Defaults to 'put'
         * @param value
         * @returns {RailsResourceProvider} The provider instance
         */
        this.updateMethod = function (value) {
            defaultOptions.updateMethod = value;
            return this;
        };

        /**
         * Configures default HTTP configuration operations for all RailsResources.
         *
         * @param {Object} value See $http for available configuration options.
         * @returns {RailsResourceProvider} The provider instance
         */
        this.httpConfig = function (value) {
            defaultOptions.httpConfig = value;
            return this;
        };

        /**
         * Configures default HTTP query parameters for all RailsResources.
         *
         * @param {Object} value Object of key/value pairs representing the HTTP query parameters for all HTTP operations.
         * @returns {RailsResourceProvider} The provider instance
         */
        this.defaultParams = function (value) {
            defaultOptions.defaultParams = value;
            return this;
        };

        /**
         * Configures whether or not underscore query parameters
         * @param {boolean} value true to underscore.  Defaults to true.
         * @returns {RailsResourceProvider} The provider instance
         */
        this.underscoreParams = function (value) {
            defaultOptions.underscoreParams = value;
            return this;
        };

        /**
         * Configures whether the full response from $http is returned or just the result data.
         * @param {boolean} value true to return full $http response.  Defaults to false.
         * @returns {RailsResourceProvider} The provider instance
         */
        this.fullResponse = function (value) {
            defaultOptions.fullResponse = value;
            return this;
        };

        /**
         * List of RailsResource extensions to include by default.
         *
         * @param {...string} extensions One or more extension names to include
         * @returns {*}
         */
        this.extensions = function () {
            defaultOptions.extensions = [];
            angular.forEach(arguments, function (value) {
                defaultOptions.extensions = defaultOptions.extensions.concat(value);
            });
            return this;
        };

        this.$get = ['$http', '$q', '$timeout', 'railsUrlBuilder', 'railsSerializer', 'railsRootWrapper', 'RailsResourceInjector',
            function ($http, $q, $timeout, railsUrlBuilder, railsSerializer, railsRootWrapper, RailsResourceInjector) {

                function RailsResource(value) {
                    if (value) {
                        var response = this.constructor.deserialize({data: value});
                        if (this.constructor.config.rootWrapping) {
                            response = railsRootWrapper.unwrap(response, this.constructor, true);
                        }
                        angular.extend(this, response.data);
                        this.constructor.runInterceptorPhase('afterDeserialize', this);
                    }
                }

                /**
                 * Extends the RailsResource to the child constructor function making the child constructor a subclass of
                 * RailsResource.  This is modeled off of CoffeeScript's class extend function.  All RailsResource
                 * class properties defined are copied to the child class and the child's prototype chain is configured
                 * to allow instances of the child class to have all of the instance methods of RailsResource.
                 *
                 * Like CoffeeScript, a __super__ property is set on the child class to the parent resource's prototype chain.
                 * This is done to allow subclasses to extend the functionality of instance methods and still
                 * call back to the original method using:
                 *
                 *     Class.__super__.method.apply(this, arguments);
                 *
                 * @param {function} child Child constructor function
                 * @returns {function} Child constructor function
                 */
                RailsResource.extendTo = function (child) {
                    angular.forEach(this, function (value, key) {
                        child[key] = value;
                    });

                    if (angular.isArray(this.$modules)) {
                        child.$modules = this.$modules.slice(0);
                    }

                    function ctor() {
                        this.constructor = child;
                    }

                    ctor.prototype = this.prototype;
                    child.prototype = new ctor();
                    child.__super__ = this.prototype;
                    return child;
                };

                /**
                 * Copies a mixin's properties to the resource.
                 *
                 * If module is a String then we it will be loaded using Angular's dependency injection.  If the name is
                 * not valid then Angular will throw an error.
                 *
                 * @param {...String|function|Object} mixins The mixin or name of the mixin to add.
                 * @returns {RailsResource} this
                 */
                RailsResource.extend = function () {
                    angular.forEach(arguments, function (mixin) {
                        addMixin(this, this, mixin, function (Resource, mixin) {
                            if (angular.isFunction(mixin.extended)) {
                                mixin.extended(Resource);
                            }
                        });
                    }, this);

                    return this;
                };

                /**
                 * Copies a mixin's properties to the resource's prototype chain.
                 *
                 * If module is a String then we it will be loaded using Angular's dependency injection.  If the name is
                 * not valid then Angular will throw an error.
                 *
                 * @param {...String|function|Object} mixins The mixin or name of the mixin to add
                 * @returns {RailsResource} this
                 */
                RailsResource.include = function () {
                    angular.forEach(arguments, function (mixin) {
                        addMixin(this, this.prototype, mixin, function (Resource, mixin) {
                            if (angular.isFunction(mixin.included)) {
                                mixin.included(Resource);
                            }
                        });
                    }, this);

                    return this;
                };

                /**
                 * Sets configuration options.  This method may be called multiple times to set additional options or to
                 * override previous values (such as the case with inherited resources).
                 * @param cfg
                 */
                RailsResource.configure = function (cfg) {
                    cfg = cfg || {};

                    if (this.config) {
                        cfg = angular.extend({}, this.config, cfg);
                    }

                    this.config = {};
                    this.config.idAttribute = cfg.idAttribute || 'id';
                    this.config.url = cfg.url;
                    this.config.rootWrapping = booleanParam(cfg.rootWrapping, defaultOptions.rootWrapping); // using undefined check because config.rootWrapping || true would be true when config.rootWrapping === false
                    this.config.httpConfig = cfg.httpConfig || defaultOptions.httpConfig;
                    this.config.httpConfig.headers = angular.extend({'Accept': 'application/json', 'Content-Type': 'application/json'}, this.config.httpConfig.headers || {});
                    this.config.defaultParams = cfg.defaultParams || defaultOptions.defaultParams;
                    this.config.underscoreParams = booleanParam(cfg.underscoreParams, defaultOptions.underscoreParams);
                    this.config.updateMethod = (cfg.updateMethod || defaultOptions.updateMethod).toLowerCase();
                    this.config.fullResponse = booleanParam(cfg.fullResponse, defaultOptions.fullResponse);
                    this.config.singular = cfg.singular || defaultOptions.singular;

                    this.config.requestTransformers = cfg.requestTransformers ? cfg.requestTransformers.slice(0) : [];
                    this.config.responseInterceptors = cfg.responseInterceptors ? cfg.responseInterceptors.slice(0) : [];
                    this.config.afterResponseInterceptors = cfg.afterResponseInterceptors ? cfg.afterResponseInterceptors.slice(0) : [];
                    this.config.interceptors = cfg.interceptors ? cfg.interceptors.slice(0) : [];

                    this.config.serializer = RailsResourceInjector.getService(cfg.serializer || railsSerializer());

                    this.config.name = this.config.serializer.underscore(cfg.name);

                    // we don't want to turn undefined name into "undefineds" then the plural name won't update when the name is set
                    if (this.config.name) {
                        this.config.pluralName = this.config.serializer.underscore(cfg.pluralName || this.config.serializer.pluralize(this.config.name));
                    }

                    this.config.urlBuilder = railsUrlBuilder(this.config);
                    this.config.resourceConstructor = this;

                    this.extend.apply(this, loadExtensions((cfg.extensions || []).concat(defaultOptions.extensions)));

                    angular.forEach(this.$mixins, function (mixin) {
                        if (angular.isFunction(mixin.configure)) {
                            mixin.configure(this.config, cfg);
                        }
                    }, this);

                    return this.config;
                };

                /**
                 * Configures the URL for the resource.
                 * @param {String|function} url The url string or function.
                 */
                RailsResource.setUrl = function (url) {
                    this.configure({url: url});
                };

                RailsResource.buildUrl = function (context) {
                    return this.config.urlBuilder(context);
                };

                /**
                 * Interceptors utilize $q promises to allow for both synchronous and asynchronous processing during
                 * a request / response cycle.
                 *
                 * Interceptors can be added as a service factory name or as an object with properties matching one
                 * or more of the phases.  Each property should have a value of a function to be called during that phase.
                 *
                 * There are multiple phases for both request and response.  In addition, each phase has a corresponding
                 * error phase to handle promise rejections.
                 *
                 * Each request phase interceptor is called with the $http config object, the resource constructor, and if
                 * applicable the resource instance.  The interceptor is free to modify the config or create a new one.
                 * The interceptor function must return a valid $http config or a promise that will eventually resolve
                 * to a config object.
                 *
                 * The valid request phases are:
                 *
                 * * beforeRequest: Interceptors are called prior to any data serialization or root wrapping.
                 * * beforeRequestError: Interceptors get called when a previous interceptor threw an error or
                 *      resolved with a rejection.
                 * * beforeRequestWrapping: Interceptors are called after data serialization but before root wrapping.
                 * * beforeRequestWrappingError: Interceptors get called when a previous interceptor threw an error or
                 *      resolved with a rejection.
                 * * request:  Interceptors are called after any data serialization and root wrapping have been performed.
                 * * requestError: Interceptors get called when a previous interceptor threw an error or
                 *      resolved with a rejection.
                 *
                 * The beforeResponse and response interceptors are called with the $http response object,
                 * the resource constructor, and if applicable the resource instance.  The afterResponse interceptors
                 * are typically called with the response data instead of the full response object unless the config option
                 * fullResponse has been set to true.  Like the request interceptor callbacks the response callbacks can
                 * manipulate the data or return new data.  The interceptor function must return
                 *
                 * The valid response phases are:
                 *
                 * * beforeResponse: Interceptors are called prior to any data processing.
                 * * beforeResponseError: Interceptors get called when a previous interceptor threw an error or
                 *      resolved with a rejection.
                 * * beforeResponseDeserialize: Interceptors are called after root unwrapping but prior to data deserializing.
                 * * beforeResponseDeserializeError: Interceptors get called when a previous interceptor threw an error or
                 *      resolved with a rejection.
                 * * response:  Interceptors are called after the data has been deserialized and root unwrapped but
                 *      prior to the data being copied to the resource instance if applicable.
                 * * responseError: Interceptors get called when a previous interceptor threw an error or
                 *      resolved with a rejection.
                 * * afterResponse:  Interceptors are called at the very end of the response chain after all processing
                 *      has been completed.  The value of the first parameter is one of the following:
                 *       - resource instance: When fullResponse is false and the operation was called on a resource instance.
                 *       - response data: When fullResponse is false and the operation was called on the resource class.
                 *       - $http response: When fullResponse is true
                 * * afterResponseError: Interceptors get called when a previous interceptor threw an error or
                 *      resolved with a rejection.
                 *
                 * Finally, for each deserialized resource including associations, deserialization phases are called.
                 *
                 * The valid deserialization phases are:
                 *
                 * * afterDeserialize: Interceptors are called after a resource has been deserialized.
                 *
                 * @param {String | Object} interceptor
                 */
                RailsResource.addInterceptor = function (interceptor) {
                    this.config.interceptors.push(interceptor);
                };

                /**
                 * Adds an interceptor callback function for the specified phase.
                 * @param {String} phase The interceptor phase, one of:
                 *      beforeRequest, request, beforeResponse, response, afterResponse, afterDeserialize
                 * @param fn The function to call.
                 */
                RailsResource.intercept = function (phase, fn) {
                    var interceptor = {};
                    fn = RailsResourceInjector.getDependency(fn);

                    interceptor[phase] = function (value, resourceConstructor, context) {
                        return fn(value, resourceConstructor, context) || value;
                    };

                    this.addInterceptor(interceptor);
                };

                /**
                 * Adds interceptor on 'beforeRequest' phase.
                 * @param fn(httpConfig, constructor, context) - httpConfig is the config object to pass to $http,
                 *      constructor is the resource class calling the function,
                 *      context is the resource instance of the calling method (create, update, delete) or undefined if the method was a class method (get, query)
                 */
                RailsResource.interceptBeforeRequest = function (fn) {
                    this.intercept('beforeRequest', fn);
                };

                /**
                 * Adds interceptor on 'beforeRequestWrapping' phase.
                 * @param fn(httpConfig, constructor, context) - httpConfig is the config object to pass to $http,
                 *      constructor is the resource class calling the function,
                 *      context is the resource instance of the calling method (create, update, delete) or undefined if the method was a class method (get, query)
                 */
                RailsResource.interceptBeforeRequestWrapping = function (fn) {
                    this.intercept('beforeRequestWrapping', fn);
                };

                /**
                 * Adds interceptor on 'request' phase.
                 * @param fn(httpConfig, constructor, context) - httpConfig is the config object to pass to $http,
                 *      constructor is the resource class calling the function,
                 *      context is the resource instance of the calling method (create, update, delete) or undefined if the method was a class method (get, query)
                 */
                RailsResource.interceptRequest = function (fn) {
                    this.intercept('request', fn);
                };

                /**
                 * Adds interceptor on 'beforeResponse' phase.
                 * @param fn(response data, constructor, context) - response data is either the resource instance returned or an array of resource instances,
                 *      constructor is the resource class calling the function,
                 *      context is the resource instance of the calling method (create, update, delete) or undefined if the method was a class method (get, query)
                 */
                RailsResource.interceptBeforeResponse = function (fn) {
                    this.intercept('beforeResponse', fn);
                };

                /**
                 * Adds interceptor on 'beforeResponseDeserialize' phase.
                 * @param fn(response data, constructor, context) - response data is either the resource instance returned or an array of resource instances,
                 *      constructor is the resource class calling the function,
                 *      context is the resource instance of the calling method (create, update, delete) or undefined if the method was a class method (get, query)
                 */
                RailsResource.interceptBeforeResponseDeserialize = function (fn) {
                    this.intercept('beforeResponseDeserialize', fn);
                };

                /**
                 * Adds interceptor on 'response' phase.
                 * @param fn(response data, constructor, context) - response data is either the resource instance returned or an array of resource instances,
                 *      constructor is the resource class calling the function,
                 *      context is the resource instance of the calling method (create, update, delete) or undefined if the method was a class method (get, query)
                 */
                RailsResource.interceptResponse = function (fn) {
                    this.intercept('response', fn);
                };

                /**
                 * Adds interceptor on 'afterResponse' phase.
                 * @param fn(response data, constructor, context) - response data is either the resource instance returned or an array of resource instances,
                 *      constructor is the resource class calling the function,
                 *      context is the resource instance of the calling method (create, update, delete) or undefined if the method was a class method (get, query)
                 */
                RailsResource.interceptAfterResponse = function (fn) {
                    this.intercept('afterResponse', fn);
                };

                /**
                 * Adds interceptor on 'afterDeserialize' phase.
                 * @param fn(response data, constructor, context) - response data is either the resource instance returned or an array of resource instances,
                 *      constructor is the resource class calling the function,
                 *      context is the resource instance of the calling method (create, update, delete) or undefined if the method was a class method (get, query)
                 */
                RailsResource.interceptAfterDeserialize = function (fn) {
                    this.intercept('afterDeserialize', fn);
                };

                /**
                 * Deprecated, see interceptors
                 * Add a callback to run on response.
                 * @deprecated since version 1.0.0, use interceptResponse instead
                 * @param fn(response data, constructor, context) - response data is either the resource instance returned or an array of resource instances,
                 *      constructor is the resource class calling the function,
                 *      context is the resource instance of the calling method (create, update, delete) or undefined if the method was a class method (get, query)
                 */
                RailsResource.beforeResponse = function (fn) {
                    fn = RailsResourceInjector.getDependency(fn);
                    this.interceptResponse(function (response, resource, context) {
                        fn(response.data, resource.config.resourceConstructor, context);
                        return response;
                    });
                };

                /**
                 * Deprecated, see interceptors
                 * Add a callback to run after response has been processed.  These callbacks are not called on object construction.
                 * @deprecated since version 1.0.0, use interceptAfterResponse instead
                 * @param fn(response data, constructor) - response data is either the resource instance returned or an array of resource instances and constructor is the resource class calling the function
                 */
                RailsResource.afterResponse = function (fn) {
                    fn = RailsResourceInjector.getDependency(fn);
                    this.interceptAfterResponse(function (response, resource, context) {
                        fn(response, resource.config.resourceConstructor, context);
                        return response;
                    });
                };

                /**
                 * Deprecated, see interceptors
                 * Adds a function to run after serializing the data to send to the server, but before root-wrapping it.
                 * @deprecated since version 1.0.0, use interceptBeforeRequestWrapping instead
                 * @param fn (data, constructor) - data object is the serialized resource instance, and constructor the resource class calling the function
                 */
                RailsResource.beforeRequest = function (fn) {
                    fn = RailsResourceInjector.getDependency(fn);
                    this.interceptBeforeRequestWrapping(function (httpConfig, resource) {
                        httpConfig.data = fn(httpConfig.data, resource.config.resourceConstructor) || httpConfig.data;
                        return httpConfig;
                    });
                };

                RailsResource.serialize = function (httpConfig) {
                    if (httpConfig.data) {
                        httpConfig.data = this.config.serializer.serialize(httpConfig.data);
                    }

                    return httpConfig;
                };

                /**
                 * Deserializes the response data on the $http response.  Stores the original version of the data
                 * on the response as "originalData" and sets the deserialized data in the "data" property.
                 * @param response The $http response object
                 * @returns {*} The $http response
                 */
                RailsResource.deserialize = function (response) {
                    response.data = this.config.serializer.deserialize(response.data, this.config.resourceConstructor);
                    return response;
                };

                /**
                 * Deprecated, see interceptors
                 * Transform data after response has been converted to a resource instance
                 * @deprecated
                 * @param promise
                 * @param context
                 */
                RailsResource.callResponseInterceptors = function (promise, context) {
                    var config = this.config;
                    forEachDependency(config.responseInterceptors, function (interceptor) {
                        promise.resource = config.resourceConstructor;
                        promise.context = context;
                        promise = interceptor(promise);
                    });
                    return promise;
                };

                /**
                 * Deprecated, see interceptors
                 * Transform data after response has been converted to a resource instance
                 * @deprecated
                 * @param promise
                 * @param context
                 */
                RailsResource.callAfterResponseInterceptors = function (promise) {
                    var config = this.config;
                    // data is now deserialized. call response interceptors including afterResponse
                    forEachDependency(config.afterResponseInterceptors, function (interceptor) {
                        promise.resource = config.resourceConstructor;
                        promise = interceptor(promise);
                    });

                    return promise;
                };

                RailsResource.runInterceptorPhase = function (phase, context, promise) {
                    promise = promise || $q.resolve(context);
                    var config = this.config, chain = [];

                    forEachDependency(config.interceptors, function (interceptor) {
                        if (interceptor[phase] || interceptor[phase + 'Error']) {
                            chain.push(interceptor[phase], interceptor[phase + 'Error']);
                        }
                    });

                    while (chain.length) {
                        var thenFn = chain.shift();
                        var rejectFn = chain.shift();

                        promise = promise.then(createInterceptorSuccessCallback(thenFn, config.resourceConstructor, context),
                            createInterceptorRejectionCallback(rejectFn, config.resourceConstructor, context));
                    }

                    return promise;
                };

                /**
                 * Executes an HTTP request using $http.
                 *
                 * This method is used by all RailsResource operations that execute HTTP requests.  Handles serializing
                 * the request data using the resource serializer, root wrapping (if enabled), deserializing the response
                 * data using the resource serializer, root unwrapping (if enabled), and copying the result back into the
                 * resource context if applicable.  Executes interceptors at each phase of the request / response to allow
                 * users to build synchronous & asynchronous customizations to manipulate the data as necessary.
                 *
                 * @param httpConfig The config to pass to $http, see $http docs for details
                 * @param context An optional reference to the resource instance that is the context for the operation.
                 *      If specified, the result data will be copied into the context during the response handling.
                 * @param resourceConfigOverrides An optional set of RailsResource configuration options overrides.
                 *      These overrides allow users to build custom operations more easily with different resource settings.
                 * @returns {Promise} The promise that will eventually be resolved after all request / response handling
                 *      has completed.
                 */
                RailsResource.$http = function (httpConfig, context, resourceConfigOverrides) {
                    var timeoutPromise, promise,
                        config = angular.extend(angular.copy(this.config), resourceConfigOverrides || {}),
                        resourceConstructor = config.resourceConstructor,
                        abortDeferred = $q.defer();

                    function abortRequest() {
                        abortDeferred.resolve();
                    }

                    if (httpConfig && httpConfig.timeout) {
                        if (httpConfig.timeout > 0) {
                            timeoutPromise = $timeout(abortDeferred.resolve, httpConfig.timeout);
                        } else if (angular.isFunction(httpConfig.timeout.then)) {
                            httpConfig.timeout.then(abortDeferred.resolve);
                        }
                    }

                    httpConfig = angular.extend({}, httpConfig, {timeout: abortDeferred.promise});
                    promise = $q.when(httpConfig);

                    if (!config.skipRequestProcessing) {

                        promise = this.runInterceptorPhase('beforeRequest', context, promise).then(function (httpConfig) {
                            httpConfig = resourceConstructor.serialize(httpConfig);

                            forEachDependency(config.requestTransformers, function (transformer) {
                                httpConfig.data = transformer(httpConfig.data, config.resourceConstructor);
                            });

                            return httpConfig;
                        });

                        promise = this.runInterceptorPhase('beforeRequestWrapping', context, promise);

                        if (config.rootWrapping) {
                            promise = promise.then(function (httpConfig) {
                                httpConfig.data = railsRootWrapper.wrap(httpConfig.data, config.resourceConstructor);
                                return httpConfig;
                            });
                        }

                        promise = this.runInterceptorPhase('request', context, promise).then(function (httpConfig) {
                            return $http(httpConfig);
                        });

                    } else {
                        promise = $http(httpConfig);
                    }

                    // After the request has completed we need to cancel any pending timeout
                    if (timeoutPromise) {
                        // not using finally here to stay compatible with angular 1.0
                        promise = promise.then(function (result) {
                            $timeout.cancel(timeoutPromise);
                            return result;
                        }, function (error) {
                            $timeout.cancel(timeoutPromise);
                            return $q.reject(error);
                        });
                    }

                    promise = this.runInterceptorPhase('beforeResponse', context, promise).then(function (response) {
                      // store off the data so we don't lose access to it after deserializing and unwrapping
                      response.originalData = response.data;
                      return response;
                    });

                    if (config.rootWrapping) {
                        promise = promise.then(function (response) {
                            return railsRootWrapper.unwrap(response, config.resourceConstructor, false);
                        });
                    }

                    promise = this.runInterceptorPhase('beforeResponseDeserialize', context, promise).then(function (response) {
                        return resourceConstructor.deserialize(response);
                    });

                    promise = this.callResponseInterceptors(promise, context);
                    promise = this.runInterceptorPhase('response', context, promise).then(function (response) {
                        if (context) {
                            // we may not have response data
                            if (response.hasOwnProperty('data') && angular.isObject(response.data)) {
                                angular.extend(context, response.data);
                            }
                        }

                        return config.fullResponse ? response : (context || response.data);
                    });

                    promise = this.callAfterResponseInterceptors(promise, context);
                    promise = this.runInterceptorPhase('afterResponse', context, promise);
                    promise = this.runInterceptorPhase('afterDeserialize', context, promise);
                    return extendPromise(promise, {
                        resource: config.resourceConstructor,
                        context: context,
                        abort: abortRequest
                    });
                };

                /**
                 * Processes query parameters before request.  You can override to modify
                 * the query params or return a new object.
                 *
                 * @param {Object} queryParams - The query parameters for the request
                 * @returns {Object} The query parameters for the request
                 */
                RailsResource.processParameters = function (queryParams) {
                    var newParams = {};

                    if (angular.isObject(queryParams) && this.config.underscoreParams) {
                        angular.forEach(queryParams, function (v, k) {
                            newParams[this.config.serializer.underscore(k)] = v;
                        }, this);

                        return newParams;
                    }

                    return queryParams;
                };

                RailsResource.getParameters = function (queryParams) {
                    var params;

                    if (this.config.defaultParams) {
                        // we need to clone it so we don't modify it when we add the additional
                        // query params below
                        params = angular.copy(this.config.defaultParams);
                    }

                    if (angular.isObject(queryParams)) {
                        params = angular.extend(params || {}, queryParams);
                    }

                    return this.processParameters(params);
                };

                RailsResource.getHttpConfig = function (queryParams) {
                    var params = this.getParameters(queryParams);

                    if (params) {
                        return angular.extend({params: params}, this.config.httpConfig);
                    }

                    return angular.copy(this.config.httpConfig);
                };

                /**
                 * Returns a URL from the given parameters.  You can override this method on your resource definitions to provide
                 * custom logic for building your URLs or you can utilize the parameterized url strings to substitute values in the
                 * URL string.
                 *
                 * The parameters in the URL string follow the normal Angular binding expression using {{ and }} for the start/end symbols.
                 *
                 * If the context is a number and the URL string does not contain an id parameter then the number is appended
                 * to the URL string.
                 *
                 * If the context is a number and the URL string does
                 * @param context
                 * @param path {string} (optional) An additional path to append to the URL
                 * @return {string}
                 */
                 RailsResource.$url = RailsResource.resourceUrl = function (ctxt, path) {
                     var context = ctxt;
                     if (!angular.isObject(ctxt)) {
                         context = {};
                         context[this.config.idAttribute] = ctxt;
                     }

                     return appendPath(this.buildUrl(context || {}), path);
                 };

                RailsResource.$get = function (url, queryParams) {
                    return this.$http(angular.extend({method: 'get', url: url}, this.getHttpConfig(queryParams)));
                };

                RailsResource.query = function (queryParams, context) {
                    return this.$get(this.resourceUrl(context), queryParams);
                };

                RailsResource.get = function (context, queryParams) {
                    return this.$get(this.resourceUrl(context), queryParams);
                };

                /**
                 * Returns the URL for this resource.
                 *
                 * @param path {string} (optional) An additional path to append to the URL
                 * @returns {string} The URL for the resource
                 */
                RailsResource.prototype.$url = function (path) {
                    return appendPath(this.constructor.resourceUrl(this), path);
                };

                /**
                 * Executes $http with the resource instance as the context.
                 *
                 * @param httpConfig The config to pass to $http, see $http docs for details
                 * @param context An optional reference to the resource instance that is the context for the operation.
                 *      If specified, the result data will be copied into the context during the response handling.
                 * @param resourceConfigOverrides An optional set of RailsResource configuration options overrides.
                 *      These overrides allow users to build custom operations more easily with different resource settings.
                 * @returns {Promise} The promise that will eventually be resolved after all request / response handling
                 *      has completed.
                 */
                RailsResource.prototype.$http = function (httpConfig, resourceConfigOverrides) {
                    return this.constructor.$http(httpConfig, this, resourceConfigOverrides);
                };

                angular.forEach(['post', 'put', 'patch'], function (method) {
                    RailsResource['$' + method] = function (url, data, resourceConfigOverrides, queryParams) {
                        // clone so we can manipulate w/o modifying the actual instance
                        data = angular.copy(data);
                        return this.$http(angular.extend({method: method, url: url, data: data}, this.getHttpConfig(queryParams)), null, resourceConfigOverrides);
                    };

                    RailsResource.prototype['$' + method] = function (url, context, queryParams) {
                        // clone so we can manipulate w/o modifying the actual instance
                        var data = angular.copy(this, {});
                        return this.constructor.$http(angular.extend({method: method, url: url, data: data}, this.constructor.getHttpConfig(queryParams)), this);
                    };
                });

                RailsResource.prototype.create = function () {
                    return this.$post(this.$url(), this);
                };

                RailsResource.prototype.update = function () {
                    return this['$' + this.constructor.config.updateMethod](this.$url(), this);
                };

                RailsResource.prototype.get = function () {
                    return this.constructor.$http(angular.extend({method: 'GET', url: this.$url()}, this.constructor.getHttpConfig()), this);
                };

                RailsResource.prototype.isNew = function () {
                    var idAttribute = this.constructor.config.idAttribute;
                    return angular.isUndefined(this[idAttribute]) ||
                        this[idAttribute] === null;
                };

                RailsResource.prototype.save = function () {
                    if (this.isNew()) {
                        return this.create();
                    } else {
                        return this.update();
                    }
                };

                RailsResource.$delete = function (url, queryParams) {
                    return this.$http(angular.extend({method: 'delete', url: url}, this.getHttpConfig(queryParams)));
                };

                RailsResource.prototype.$delete = function (url, queryParams) {
                    return this.constructor.$http(angular.extend({method: 'delete', url: url}, this.constructor.getHttpConfig(queryParams)), this);
                };

                //using ['delete'] instead of .delete for IE7/8 compatibility
                RailsResource.prototype.remove = RailsResource.prototype['delete'] = function () {
                    return this.$delete(this.$url());
                };

                return RailsResource;

                function appendPath(url, path) {
                    if (path) {
                        if (path[0] !== '/') {
                            url += '/';
                        }

                        url += path;
                    }

                    return url;
                }

                function forEachDependency(list, callback) {
                    var dependency;

                    for (var i = 0, len = list.length; i < len; i++) {
                        dependency = list[i];

                        if (angular.isString(dependency)) {
                            dependency = list[i] = RailsResourceInjector.getDependency(dependency);
                        }

                        callback(dependency);
                    }
                }

                function addMixin(Resource, destination, mixin, callback) {
                    var excludedKeys = ['included', 'extended,', 'configure'];

                    if (!Resource.$mixins) {
                        Resource.$mixins = [];
                    }

                    if (angular.isString(mixin)) {
                        mixin = RailsResourceInjector.getDependency(mixin);
                    }

                    if (mixin && Resource.$mixins.indexOf(mixin) === -1) {
                        angular.forEach(mixin, function (value, key) {
                            if (excludedKeys.indexOf(key) === -1) {
                                destination[key] = value;
                            }
                        });

                        Resource.$mixins.push(mixin);

                        if (angular.isFunction(callback)) {
                            callback(Resource, mixin);
                        }
                    }
                }

                function loadExtensions(extensions) {
                    var modules = [];

                    angular.forEach(extensions, function (extensionName) {
                        extensionName = 'RailsResource' + extensionName.charAt(0).toUpperCase() + extensionName.slice(1) + 'Mixin';

                        modules.push(RailsResourceInjector.getDependency(extensionName));
                    });

                    return modules;
                }

                function booleanParam(value, defaultValue) {
                    return angular.isUndefined(value) ? defaultValue : value;
                }

                function createInterceptorSuccessCallback(thenFn, resourceConstructor, context) {
                    return function (data) {
                        return (thenFn || angular.identity)(data, resourceConstructor, context);
                    };
                }

                function createInterceptorRejectionCallback(rejectFn, resourceConstructor, context) {
                    return function (rejection) {
                        // can't use identity because we need to return a rejected promise to keep the error chain going
                        return rejectFn ? rejectFn(rejection, resourceConstructor, context) : $q.reject(rejection);
                    };
                }

                function extendPromise(promise, attributes) {
                    var oldThen = promise.then;
                    promise.then = function (onFulfilled, onRejected, progressBack) {
                        var chainedPromise = oldThen.apply(this, arguments);
                        return extendPromise(chainedPromise, attributes);
                    };
                    angular.extend(promise, attributes);
                    return promise;
                }
            }];
    });

    angular.module('rails').factory('railsResourceFactory', ['RailsResource', function (RailsResource) {
        return function (config) {
            function Resource() {
                Resource.__super__.constructor.apply(this, arguments);
            }

            RailsResource.extendTo(Resource);
            Resource.configure(config);

            return Resource;
        };
    }]);

}());
