describe('railsResourceFactory', function () {
    'use strict';

    beforeEach(function() {
        module('rails');

        angular.module('rails').factory('railsTestInterceptor', function () {
            return function (promise) {
                return promise.then(function (response) {
                    response.data.interceptorAdded = 'x';
                    return response;
                });
            }
        });
    });

    describe('singular', function() {
        var $httpBackend, $timeout, $rootScope, factory, Test, testInterceptor,
            config = {
                url: '/test',
                name: 'test'
            };

        beforeEach(inject(function (_$httpBackend_, _$timeout_, _$rootScope_, railsResourceFactory, railsTestInterceptor) {
            $httpBackend = _$httpBackend_;
            $timeout = _$timeout_;
            $rootScope = _$rootScope_;
            factory = railsResourceFactory;
            Test = railsResourceFactory(config);
            testInterceptor = railsTestInterceptor;
        }));

        afterEach(function() {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        it('query should return resource object when response is single object', function () {
            var promise, result;

            $httpBackend.expectGET('/test').respond(200, {test: {abc: 'xyz'}});

            expect(promise = Test.query()).toBeDefined();

            promise.then(function (response) {
                result = response;
            });

            $httpBackend.flush();

            expect(result).toBeInstanceOf(Test);
            expect(result).toEqualData({abc: 'xyz'});
        });

        it('query should return no data on 204', function () {
            var promise, result;

            $httpBackend.expectGET('/test').respond(204);
            expect(promise = Test.query()).toBeDefined();

            promise.then(function (response) {
                result = response;
            });

            $httpBackend.flush();

            expect(result).toBeUndefined();
        });

        it('query should add parameter abc=1', function () {
            var promise;

            $httpBackend.expectGET('/test?abc=1').respond(200, {test: {abc: 'xyz'}});

            expect(promise = Test.query({abc: '1'})).toBeDefined();
            $httpBackend.flush();
        });

        it('query should add parameters abc=1 & xyz=2', function () {
            var promise;

            $httpBackend.expectGET('/test?abc=1&xyz=2').respond(200, {test: {abc: 'xyz'}});

            expect(promise = Test.query({abc: '1', xyz: 2})).toBeDefined();
            $httpBackend.flush();
        });

        it('query should underscore parameters abc_xyz=1 & test=2', function () {
            var promise;

            $httpBackend.expectGET('/test?abc_xyz=1&test=2').respond(200, {test: {abc: 'xyz'}});

            expect(promise = Test.query({abcXyz: '1', test: 2})).toBeDefined();
            $httpBackend.flush();
        });

        it('query should not underscore parameters abcXyz=1 & test=2', function () {
            var promise;

            $httpBackend.expectGET('/test?abcXyz=1&test=2').respond(200, {test: {abc: 'xyz'}});
            Test = factory(angular.extend({underscoreParams: false}, config));
            expect(promise = Test.query({abcXyz: '1', test: 2})).toBeDefined();
            $httpBackend.flush();
        });

        it('Parameter underscoring should not modify the defaultParams.', function () {
            var promise;

            $httpBackend.expectGET('/test?abc_xyz=1').respond(200, {test: {abc: 'xyz'}});
            Test = factory(angular.extend({defaultParams: {abcXyz: 1}}, config));
            expect(promise = Test.query()).toBeDefined();
            $httpBackend.flush();
            expect(Test.config.defaultParams.abcXyz).toBeDefined();
            expect(Test.config.defaultParams.abc_xyz).not.toBeDefined();
        });

        it('query with default params should add parameter abc=1', function () {
            var promise, resource, defaultParamsConfig = {};

            $httpBackend.expectGET('/test?abc=1').respond(200, {test: {abc: 'xyz'}});

            angular.copy(config, defaultParamsConfig);
            defaultParamsConfig.defaultParams = {abc: '1'};

            resource = factory(defaultParamsConfig);
            expect(promise = resource.query()).toBeDefined();

            $httpBackend.flush();
        });

        it('query with default params and additional parameters should not modify default params', function () {
            var promise, resource, defaultParamsConfig = {};

            $httpBackend.expectGET('/test?abc=1&xyz=2').respond(200, {test: {abc: 'xyz'}});

            angular.copy(config, defaultParamsConfig);
            defaultParamsConfig.defaultParams = {abc: '1'};

            resource = factory(defaultParamsConfig);
            expect(promise = resource.query({xyz: '2'})).toBeDefined();

            $httpBackend.flush();
            expect(resource.config.defaultParams).toEqualData({abc: '1'});
        });

        it('get should return resource object when response is 200', function () {
            var promise, result;

            $httpBackend.expectGET('/test/123').respond(200, {test: {id: 123, abc: 'xyz'}});

            expect(promise = Test.get(123)).toBeDefined();

            promise.then(function (response) {
                result = response;
            });

            $httpBackend.flush();

            expect(result).toBeInstanceOf(Test);
            expect(result).toEqualData({id: 123, abc: 'xyz'});
        });

        it('get should work with id as string as well', function () {
            var promise, result;

            $httpBackend.expectGET('/test/123').respond(200, {test: {id: 123, abc: 'xyz'}});

            expect(promise = Test.get('123')).toBeDefined();

            promise.then(function (response) {
                result = response;
            });

            $httpBackend.flush();

            expect(result).toBeInstanceOf(Test);
            expect(result).toEqualData({id: 123, abc: 'xyz'});
        });

        it('get should call failure callback when 404', function () {
            inject(function ($exceptionHandler) {
                var promise, success = false, failure = false;

                $httpBackend.expectGET('/test/123').respond(404);

                expect(promise = Test.get(123)).toBeDefined();

                promise.then(function () {
                    success = true;
                }, function () {
                    failure = true;
                });

                $httpBackend.flush();
                expect($exceptionHandler.errors).toEqual([]);
                expect(success).toBe(false);
                expect(failure).toBe(true);
            });
        });

        it('get with default params should add parameter abc=1', function () {
            var promise, resource, defaultParamsConfig = {};

            $httpBackend.expectGET('/test/123?abc=1').respond(200, {test: {abc: 'xyz'}});

            angular.copy(config, defaultParamsConfig);
            defaultParamsConfig.defaultParams = {abc: '1'};

            resource = factory(defaultParamsConfig);
            expect(promise = resource.get(123)).toBeDefined();

            $httpBackend.flush();
        });

        it('should be able to create new instance and save it', function () {
            var data = new Test({abcDef: 'xyz'});

            $httpBackend.expectPOST('/test', {test: {abc_def: 'xyz'}}).respond(200, {test: {id: 123, abc_def: 'xyz'}});
            data.create();
            $httpBackend.flush();

            expect(data).toEqualData({id: 123, abcDef: 'xyz'});
        });

        it("should return a promise when calling save", function () {
            var promise, data;

            data = new Test({abc_def: 'xyz'});
            $httpBackend.expectPOST('/test', {test: {abc_def: 'xyz'}}).respond(200, {test: {id: 123, abc_def: 'xyz'}});
            expect(promise = data.save()).toBeDefined();
            $httpBackend.flush()
        });

        it('should be able to create new instance and save it using save', function () {
            var data = new Test({abcDef: 'xyz'});

            $httpBackend.expectPOST('/test', {test: {abc_def: 'xyz'}}).respond(200, {test: {id: 123, abc_def: 'xyz'}});
            data.save();
            $httpBackend.flush();

            expect(data).toEqualData({id: 123, abcDef: 'xyz'});
        });

        it('should be able to create new instance and update it', function () {
            var data = new Test({abcDef: 'xyz'});

            $httpBackend.expectPOST('/test', {test: {abc_def: 'xyz'}}).respond(200, {test: {id: 123, abc_def: 'xyz'}});
            data.create();
            $httpBackend.flush(1);

            expect(data).toEqualData({id: 123, abcDef: 'xyz'});

            $httpBackend.expectPUT('/test/123', {test: {abc_def: 'xyz', id: 123, xyz: 'abc'}}).respond(200, {test: {id: 123, abc_def: 'xyz', xyz: 'abc', extra: 'test'}});
            data.xyz = 'abc';
            data.update();
            $httpBackend.flush();

            expect(data).toEqualData({id: 123, abcDef: 'xyz', xyz: 'abc', extra: 'test'});
        });

         it('should be able to create new instance and update it using save', function () {
            var data = new Test({abcDef: 'xyz'});

            $httpBackend.expectPOST('/test', {test: {abc_def: 'xyz'}}).respond(200, {test: {id: 123, abc_def: 'xyz'}});
            data.save();
            $httpBackend.flush(1);

            expect(data).toEqualData({id: 123, abcDef: 'xyz'});

            $httpBackend.expectPUT('/test/123', {test: {abc_def: 'xyz', id: 123, xyz: 'abc'}}).respond(200, {test: {id: 123, abc_def: 'xyz', xyz: 'abc', extra: 'test'}});
            data.xyz = 'abc';
            data.save();
            $httpBackend.flush();

            expect(data).toEqualData({id: 123, abcDef: 'xyz', xyz: 'abc', extra: 'test'});
        });

        it('should be able to create new instance and update it using PATCH', function () {
            var promise, Resource, data, defaultParamsConfig = {};

            angular.copy(config, defaultParamsConfig);
            defaultParamsConfig.updateMethod = 'patch';

            Resource = factory(defaultParamsConfig);
            data = new Resource({abcDef: 'xyz'});

            $httpBackend.expectPOST('/test', {test: {abc_def: 'xyz'}}).respond(200, {test: {id: 123, abc_def: 'xyz'}});
            data.create();
            $httpBackend.flush(1);

            expect(data).toEqualData({id: 123, abcDef: 'xyz'});

            $httpBackend.expectPATCH('/test/123', {test: {abc_def: 'xyz', id: 123, xyz: 'abc'}}).respond(200, {test: {id: 123, abc_def: 'xyz', xyz: 'abc', extra: 'test'}});
            data.xyz = 'abc';
            data.update();
            $httpBackend.flush();

            expect(data).toEqualData({id: 123, abcDef: 'xyz', xyz: 'abc', extra: 'test'});
        });

        it('should be able to create new instance and update it using save using PATCH', function () {
            var promise, Resource, data, defaultParamsConfig = {};

            angular.copy(config, defaultParamsConfig);
            defaultParamsConfig.updateMethod = 'patch';

            Resource = factory(defaultParamsConfig);
            data = new Resource({abcDef: 'xyz'});

            $httpBackend.expectPOST('/test', {test: {abc_def: 'xyz'}}).respond(200, {test: {id: 123, abc_def: 'xyz'}});
            data.save();
            $httpBackend.flush(1);

            expect(data).toEqualData({id: 123, abcDef: 'xyz'});

            $httpBackend.expectPATCH('/test/123', {test: {abc_def: 'xyz', id: 123, xyz: 'abc'}}).respond(200, {test: {id: 123, abc_def: 'xyz', xyz: 'abc', extra: 'test'}});
            data.xyz = 'abc';
            data.save();
            $httpBackend.flush();

            expect(data).toEqualData({id: 123, abcDef: 'xyz', xyz: 'abc', extra: 'test'});
        });


        it('create with default params should add parameter abc=1', function () {
            var promise, Resource, data, defaultParamsConfig = {};

            $httpBackend.expectPOST('/test?abc=1', {test: {}}).respond(200, {test: {abc: 'xyz'}});

            angular.copy(config, defaultParamsConfig);
            defaultParamsConfig.defaultParams = {abc: '1'};

            Resource = factory(defaultParamsConfig);
            data = new Resource();
            data.create();

            $httpBackend.flush();
        });

        it('should be able to get resource and update it', function () {
            var promise, result;

            $httpBackend.expectGET('/test/123').respond(200, {test: {id: 123, abc: 'xyz', xyz: 'abcd'}});

            expect(promise = Test.get(123)).toBeDefined();

            promise.then(function (response) {
                result = response;
            });

            $httpBackend.flush();

            expect(result).toBeInstanceOf(Test);
            expect(result).toEqualData({id: 123, abc: 'xyz', xyz: 'abcd'});

            $httpBackend.expectPUT('/test/123', {test: {id: 123, abc: 'xyz', xyz: 'abc'}}).respond(200, {test: {id: 123, abc: 'xyz', xyz: 'abc', extra: 'test'}});
            result.xyz = 'abc';
            result.update();
            $httpBackend.flush();

            // abc was originally set on the object so it should still be there after the update
            expect(result).toEqualData({id: 123, abc: 'xyz', xyz: 'abc', extra: 'test'});
        });

        it('should be able to get an existing resource to retrieve server-side updates', function () {
            var promise, result;

            $httpBackend.expectGET('/test/123').respond(200, {test: {id: 123, abc: 'xyz', xyz: 'abcd'}});

            expect(promise = Test.get(123)).toBeDefined();

            promise.then(function (response) {
              result = response;
            });

            $httpBackend.flush();

            expect(result).toBeInstanceOf(Test);
            expect(result).toEqualData({id: 123, abc: 'xyz', xyz: 'abcd'});

            var updatedData = {test: {id: 123, abc: 'zed', xyz: 'wcw', extra: 'test'}};
            $httpBackend.expectGET('/test/123').respond(200, updatedData);

           result.get();
           $httpBackend.flush();
           expect(result).toEqualData(updatedData.test);
        });

        it('update should handle 204 response', function () {
            var promise, result;

            $httpBackend.expectGET('/test/123').respond(200, {test: {id: 123, abc: 'xyz'}});

            expect(promise = Test.get(123)).toBeDefined();

            promise.then(function (response) {
                result = response;
            });

            $httpBackend.flush();

            expect(result).toBeInstanceOf(Test);
            expect(result).toEqualData({id: 123, abc: 'xyz'});

            $httpBackend.expectPUT('/test/123', {test: {id: 123, abc: 'xyz', xyz: 'abc'}}).respond(204);
            result.xyz = 'abc';
            result.update();
            $httpBackend.flush();

            expect(result).toEqualData({id: 123, abc: 'xyz', xyz: 'abc'});
        });

        it('should be able to delete instance returned from get', function () {
            var promise, result;

            $httpBackend.expectGET('/test/123').respond(200, {test: {id: 123, abc: 'xyz'}});

            expect(promise = Test.get(123)).toBeDefined();

            promise.then(function (response) {
                result = response;
            });

            $httpBackend.flush();

            expect(result).toBeInstanceOf(Test);
            expect(result).toEqualData({id: 123, abc: 'xyz'});

            $httpBackend.expectDELETE('/test/123').respond(204);
            result.remove();
            $httpBackend.flush();
        });

        it('delete with default params should add parameter abc=1', function () {
            var promise, Resource, data, defaultParamsConfig = {};

            $httpBackend.expectDELETE('/test/123?abc=1').respond(204);

            angular.copy(config, defaultParamsConfig);
            defaultParamsConfig.defaultParams = {abc: '1'};

            Resource = factory(defaultParamsConfig);
            data = new Resource();
            data.id = 123;
            data.remove();

            $httpBackend.flush();
        });

        it('should transform attributes on build', function() {
            var test = new Test({id: 123, abc_def: "T"});
            expect(test).toEqualData({id: 123, abcDef: "T"});
        });

        it('should allow changing urls after first operation', function () {
            $httpBackend.expectGET('/test/123').respond(200, {test: {id: 123, abc: 'xyz'}});
            Test.get(123);
            $httpBackend.flush();

            $httpBackend.expectGET('/test2/123').respond(200, {test: {id: 123, abc: 'xyz'}});
            Test.setUrl('/test2');
            Test.get(123);
            $httpBackend.flush();
        });

        it('should support constructing with date properties', function () {
            var testDate = new Date(),
                test = new Test({id: 123, testDate: testDate});

            expect(test.testDate).toBe(testDate);
        });

        angular.forEach(['post', 'put', 'patch'], function (method) {
            it('should be able to ' + method + ' to arbitrary url', function () {
                var promise, result = {};

                promise = Test['$' + method]('/xyz', {id: 123, abc: 'xyz', xyz: 'abc'});
                $httpBackend['expect' + angular.uppercase(method)]('/xyz', {test: {id: 123, abc: 'xyz', xyz: 'abc'}}).respond(200, {test: {id: 123, abc: 'xyz', xyz: 'abc', extra: 'test'}});

                promise.then(function (response) {
                    result = response;
                });

                $httpBackend.flush();

                // abc was originally set on the object so it should still be there after the update
                expect(result).toEqualData({id: 123, abc: 'xyz', xyz: 'abc', extra: 'test'});
            });

            it('should be able to ' + method + ' to arbitrary url with query params', function () {
                var promise, result = {};

                promise = Test['$' + method]('/xyz', {abc: 'xyz', xyz: 'abc'}, {}, {def: 'ghi'});
                $httpBackend['expect' + angular.uppercase(method)]('/xyz?def=ghi', {test: {abc: 'xyz', xyz: 'abc'}}).respond(200, {test: {abc: 'xyz', xyz: 'abc', extra: 'test'}});

                promise.then(function (response) {
                    result = response;
                });

                $httpBackend.flush();
            });

            it('should be able to ' + method + ' instance to arbitrary url', function () {
                var test = new Test({id: 123, abc: 'xyz', xyz: 'abc'});
                $httpBackend['expect' + angular.uppercase(method)]('/xyz', {test: {id: 123, abc: 'xyz', xyz: 'abc'}}).respond(200, {test: {id: 123, abc: 'xyz', xyz: 'abc', extra: 'test'}});
                test['$' + method]('/xyz');
                $httpBackend.flush();

                // abc was originally set on the object so it should still be there after the update
                expect(test).toEqualData({id: 123, abc: 'xyz', xyz: 'abc', extra: 'test'});
            });

            it('should be able to ' + method + ' instance to arbitrary url with query params', function () {
                var test = new Test({abc: 'xyz', xyz: 'abc'});
                $httpBackend['expect' + angular.uppercase(method)]('/xyz?def=ghi', {test: {abc: 'xyz', xyz: 'abc'}}).respond(200, {test: {abc: 'xyz', xyz: 'abc', extra: 'test'}});
                test['$' + method]('/xyz', {}, {def: 'ghi'});
                $httpBackend.flush();
            });
        });

        it('should be able to $post an array of resources', function () {
            var data = [{id: 123, abc: 'xyz'}, {id: 124, abc: 'xyz'}];
            $httpBackend['expectPOST']('/xyz', {tests: data} ).respond(200, {tests: data});
            Test.$post('/xyz', data);
            $httpBackend.flush();
        });

        it('should not require query params on $delete', function () {
            $httpBackend.expectDELETE('/test').respond(200);
            Test.$delete('/test');
            $httpBackend.flush();
        });

        it('should add query params passed to class $delete', function () {
            $httpBackend.expectDELETE('/test?a=1').respond(200);
            Test.$delete('/test', {a: 1});
            $httpBackend.flush();
        });

        it('should add query params passed to instance $delete', function () {
            var data = new Test({abcDef: 'xyz'});

            $httpBackend.expectDELETE('/test?a=1').respond(200);
            data.$delete('/test', {a: 1});
            $httpBackend.flush();
        });

        it('should return true for isNew when id undefined', function () {
            expect(new Test().isNew()).toBeTruthy();
        });

        it('should return true for isNew when id is null', function () {
            expect(new Test({id: null}).isNew()).toBeTruthy();
        });

        it('should return false for isNew when id is set', function () {
            expect(new Test({id: 1}).isNew()).toBeFalsy();
        });

        it('configure should return config object', function() {
          var Resource = factory();
          expect(Resource.configure(config)).toBeInstanceOf(Object);
        });

        it('get should catch exceptions on failure', function () {
            inject(function ($exceptionHandler) {
                var failure = false;

                $httpBackend.expectGET('/test/123').respond(500);

                Test.get(123).catch(function (response) { failure = true});

                $httpBackend.flush();
                expect($exceptionHandler.errors).toEqual([]);
                expect(failure).toBeTruthy();
            });
        });

        it('get should timeout after configured time', function () {
            var promise, Resource, success = false, failure = false;
            $httpBackend.expectGET('/test/123').respond(200, {test: {id: 123, abc: 'xyz'}});
            
            Resource = factory(angular.extend({}, config, {
                httpConfig: {
                    timeout: 5000
                }
            }));
            promise = Resource.get(123);
            promise.then(function () {
                success = true;
            }, function () {
                failure = true;
            });

            $timeout.flush();
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
            expect(success).toBeFalsy();
            expect(failure).toBeTruthy();                
        });

        it('$http should abort after timeout promise resolved', function () {
            inject(function ($q) {
                var promise, success = false, failure = false,
                    timeoutDeferred = $q.defer();
                $httpBackend.expectGET('/test/123').respond(200, {test: {id: 123, abc: 'xyz'}});

                promise = Test.$http({method: 'get', url: Test.resourceUrl(123), timeout: timeoutDeferred.promise});
                promise.then(function () {
                    success = true;
                }, function () {
                    failure = true;
                });

                timeoutDeferred.resolve();
                $rootScope.$digest();                
                $httpBackend.verifyNoOutstandingExpectation();
                $httpBackend.verifyNoOutstandingRequest();
                expect(success).toBeFalsy();
                expect(failure).toBeTruthy(); 
            });               
        });

        it('get should abort after abort called', function () {
            inject(function ($q) {
                var promise, success = false, failure = false;
                $httpBackend.expectGET('/test/123').respond(200, {test: {id: 123, abc: 'xyz'}});

                promise = Test.get(123);
                promise.then(function () {
                    success = true;
                }, function () {
                    failure = true;
                });

                promise.abort();
                $rootScope.$digest();
                $httpBackend.verifyNoOutstandingExpectation();
                $httpBackend.verifyNoOutstandingRequest();
                expect(success).toBeFalsy();
                expect(failure).toBeTruthy();
            });
        });

        it('should have abort after chaining promise with then', function () {
            inject(function ($q) {
                var promise, success = false, failure = false;
                $httpBackend.expectGET('/test/123').respond(200, {test: {id: 123, abc: 'xyz'}});

                promise = Test.get(123).then(function () {
                    success = true;
                }, function () {
                    failure = true;
                });

                promise.abort();
                $rootScope.$digest();
                $httpBackend.verifyNoOutstandingExpectation();
                $httpBackend.verifyNoOutstandingRequest();
                expect(success).toBeFalsy();
                expect(failure).toBeTruthy();
            });
        });

        it('should have abort after chaining promise with catch', function () {
            inject(function ($q) {
                var promise, caught = false;
                $httpBackend.expectGET('/test/123').respond(200, {test: {id: 123, abc: 'xyz'}});

                promise = Test.get(123).catch(function () {
                    caught = true;
                });

                promise.abort();
                $rootScope.$digest();
                $httpBackend.verifyNoOutstandingExpectation();
                $httpBackend.verifyNoOutstandingRequest();
                expect(caught).toBeTruthy();
            });
        });

        it('should have abort after chaining promise with finally', function () {
            inject(function ($q) {
                var promise, caught = false, final = false;
                $httpBackend.expectGET('/test/123').respond(200, {test: {id: 123, abc: 'xyz'}});

                promise = Test.get(123).catch(function () {
                    caught = true;
                }).finally(function () {
                    final = true;
                });

                promise.abort();
                $rootScope.$digest();
                $httpBackend.verifyNoOutstandingExpectation();
                $httpBackend.verifyNoOutstandingRequest();
                expect(caught).toBeTruthy();
                expect(final).toBeTruthy();
            });
        });

        it('should have abort after multiple chainings', function () {
            inject(function ($q) {
                var promise, failure = false;
                $httpBackend.expectGET('/test/123').respond(200, {test: {id: 123, abc: 'xyz'}});

                promise = Test.get(123)
                    .then(function () {}, function () {
                        return $q.reject(value);
                    })
                    .then(function () {}, function () {
                        failure = true;
                    });

                promise.abort();
                $rootScope.$digest();
                $httpBackend.verifyNoOutstandingExpectation();
                $httpBackend.verifyNoOutstandingRequest();
                expect(failure).toBeTruthy();
            });
        });

        describe('overridden idAttribute', function () {
            beforeEach(inject(function (_$httpBackend_, _$rootScope_, railsResourceFactory) {
                Test = railsResourceFactory({url: '/test', name: 'test', idAttribute: 'xyz'});
            }));

            it('should return true for isNew when xyz undefined', function () {
                expect(new Test().isNew()).toBeTruthy();
            });

            it('should return true for isNew when xyz is null', function () {
                expect(new Test({xyz: null}).isNew()).toBeTruthy();
            });

            it('should return false for isNew when xyz is set', function () {
                expect(new Test({xyz: 1}).isNew()).toBeFalsy();
            });
        });
    });

    describe('plural', function() {
        var $httpBackend, $rootScope, factory, PluralTest,
            pluralConfig = {
                url: '/pluralTest',
                name: 'singular',
                pluralName: 'plural'
            };

        beforeEach(inject(function (_$httpBackend_, _$rootScope_, railsResourceFactory) {
            $httpBackend = _$httpBackend_;
            $rootScope = _$rootScope_;
            factory = railsResourceFactory;
            PluralTest = railsResourceFactory(pluralConfig);
        }));

        afterEach(function() {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        it('query should return array of resource objects when result is an array', function () {
            var promise, result;

            $httpBackend.expectGET('/pluralTest').respond(200, {plural: [{abc: 'xyz'}, {xyz: 'abc'}]});

            expect(promise = PluralTest.query()).toBeDefined();

            promise.then(function (response) {
                result = response;
            });

            $httpBackend.flush();

            expect(angular.isArray(result)).toBe(true);
            angular.forEach(result, function (value) {
                expect(value).toBeInstanceOf(PluralTest);
            });
            expect(result[0]).toEqualData({abc: 'xyz'});
            expect(result[1]).toEqualData({xyz: 'abc'});

        });

        it('query should return empty array when result is empty array', function () {
            var promise, result;

            $httpBackend.expectGET('/pluralTest').respond(200, {plural: []});

            expect(promise = PluralTest.query()).toBeDefined();

            promise.then(function (response) {
                result = response;
            });

            $httpBackend.flush();

            expect(angular.isArray(result)).toBe(true);
            expect(result.length).toBe(0);
        });
    });

    describe('subclassing', function() {
        var $httpBackend, $rootScope, Book, CarManual,
            // generated CoffeeScript Code
            __hasProp = {}.hasOwnProperty,
            __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };


        beforeEach(inject(function (_$httpBackend_, _$rootScope_, RailsResource) {
            $httpBackend = _$httpBackend_;
            $rootScope = _$rootScope_;

            // generated CoffeeScript Code
            Book = (function(_super) {
              __extends(Book, _super);

              // @configure url: '/books', name: 'book'
              Book.configure({ url: '/books', name: 'book' });
              Book.extend('RailsResourceSnapshotsMixin');
              Book.extend({ bookProperty: 1});

              function Book() {
                  Book.__super__.constructor.apply(this, arguments);
                  this.subclass = true;
              }

              return Book;

            })(RailsResource);

            CarManual = (function(_super) {
                __extends(CarManual, _super);

                CarManual.configure({ url: '/car_manuals', name: 'car_manual' });

                function CarManual() {
                    CarManual.__super__.constructor.apply(this, arguments);
                    this.subclass = true;
                }

                return CarManual;

            })(Book);
        }));

        afterEach(function() {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        it('get should return resource instance of subclass', function() {
            var promise, result;

            $httpBackend.expectGET('/car_manuals/123').respond(200, {car_manual: {id: 123, abc: 'xyz'}});

            expect(promise = CarManual.get(123)).toBeDefined();

            promise.then(function (response) {
                result = response;
            });

            $httpBackend.flush();

            expect(result).toBeInstanceOf(CarManual);
            expect(result).toEqualData({id: 123, abc: 'xyz', subclass: true});
        });

        it('should have configuration per-class', function() {
            var promise, result;

            $httpBackend.expectGET('/books/123').respond(200, {book: {id: 123, abc: 'xyz'}});

            expect(promise = Book.get(123)).toBeDefined();

            promise.then(function (response) {
                result = response;
            });

            $httpBackend.flush();

            expect(result).toBeInstanceOf(Book);
            expect(result).toEqualData({id: 123, abc: 'xyz', subclass: true});
        });

        it('should allow constructing subclasses with data', function () {
            var carManual = new CarManual({id: 1, name: 'Honda CR-V'});
            expect(carManual.id).toBe(1);
            expect(carManual.name).toBe('Honda CR-V');
        });

        it('should have included properties on subclass', function () {
            expect(CarManual.bookProperty).toBe(1);
            expect(CarManual.prototype.snapshot).toBeDefined();
        });
    });

    describe('mixins', function () {
        var railsResourceFactory;

        beforeEach(inject(function (_railsResourceFactory_) {
            railsResourceFactory = _railsResourceFactory_;
        }));

        it('should include extensions as part of initial configure', function () {
            var Resource = railsResourceFactory({name: 'test', url: '/test', extensions: ['snapshots']});
            expect(Resource.prototype.snapshot).toBeDefined();
        });

        it('should only include extensions once', function () {
            var Resource = railsResourceFactory({name: 'test', url: '/test', extensions: ['snapshots', 'snapshots']});
            expect(Resource.$mixins.length).toBe(2); // Snapshots extension includes additional mixin
            expect(Resource.prototype.snapshot).toBeDefined();
        });

        it('should only include module once', function () {
            var mixin = {test: 1}, Resource = railsResourceFactory({name: 'test', url: '/test'});
            Resource.include(mixin);
            Resource.include(mixin);
            expect(Resource.$mixins.length).toBe(1);
        });

        it('should include extensions as part of second configure call', function () {
            var Resource = railsResourceFactory({name: 'test', url: '/test'});
            Resource.configure({extensions: ['snapshots']});
            expect(Resource.prototype.snapshot).toBeDefined();
        });

        it('should throw an error if extension is not valid', function () {
            var Resource = railsResourceFactory({name: 'test', url: '/test'});
            expect(function () {
                Resource.configure({extensions: ['invalid']});
            }).toThrow();
        });

        it('should include object properties as class properties', function () {
            var Resource = railsResourceFactory({name: 'test', url: '/test'});
            Resource.extend({
                classMethod: function () {},
                classProperty: 1
            });
            expect(Resource.classMethod).toBeDefined();
            expect(Resource.classProperty).toBe(1);
        });

        it('should include class properties', function () {
            function Mixin() {}
            Mixin.classMethod = function () {};
            Mixin.classProperty = 1;

            var Resource = railsResourceFactory({name: 'test', url: '/test'});
            Resource.extend(Mixin);
            expect(Resource.classMethod).toBe(Mixin.classMethod);
            expect(Resource.classProperty).toBe(Mixin.classProperty);
        });

        it('should include instance properties', function () {
            function Mixin() {}
            Mixin.instanceMethod = function () {};
            Mixin.instanceProperty = 1;

            var Resource = railsResourceFactory({name: 'test', url: '/test'});
            Resource.include(Mixin);
            expect(Resource.prototype.instanceMethod).toBe(Mixin.instanceMethod);
            expect(Resource.prototype.instanceProperty).toBe(Mixin.instanceProperty);
        });

    });
});
