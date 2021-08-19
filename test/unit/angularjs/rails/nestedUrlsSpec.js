describe('nested urls', function () {
    'use strict';

    beforeEach(module('rails'));

    var $httpBackend, $rootScope, factory, NestedTest,
        nestedConfig = {
            url: '/nested/{{nestedId}}/test/{{id}}',
            name: 'nestedTest'
        };

    beforeEach(inject(function (_$httpBackend_, _$rootScope_, railsResourceFactory) {
        $httpBackend = _$httpBackend_;
        $rootScope = _$rootScope_;
        factory = railsResourceFactory;
        NestedTest = railsResourceFactory(nestedConfig);
    }));

    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('query should return resource object when response is single object', inject(function($httpBackend) {
        var promise, result;

        $httpBackend.expectGET('/nested/1234/test').respond(200, {nested_test: {abc: 'xyz'}});

        expect(promise = NestedTest.query(null, {nestedId: 1234})).toBeDefined();

        promise.then(function (response) {
            result = response;
        });

        $httpBackend.flush();

        expect(result).toBeInstanceOf(NestedTest);
        expect(result).toEqualData({abc: 'xyz'});
    }));

    it('query should return no data on 204', inject(function($httpBackend) {
        var promise, result;

        $httpBackend.expectGET('/nested/1234/test').respond(204);
        expect(promise = NestedTest.query(null, {nestedId: 1234})).toBeDefined();

        promise.then(function (response) {
            result = response;
        });

        $httpBackend.flush();

        expect(result).toBeUndefined();
    }));

    it('query should add parameter abc=1', inject(function($httpBackend) {
        var promise;

        $httpBackend.expectGET('/nested/1234/test?abc=1').respond(200, {nested_test: {abc: 'xyz'}});

        expect(promise = NestedTest.query({abc: '1'}, {nestedId: 1234})).toBeDefined();
        $httpBackend.flush();
    }));

    it('query should add parameters abc=1 & xyz=2', inject(function($httpBackend) {
        var promise;

        $httpBackend.expectGET('/nested/1234/test?abc=1&xyz=2').respond(200, {nested_test: {abc: 'xyz'}});

        expect(promise = NestedTest.query({abc: '1', xyz: 2}, {nestedId: 1234})).toBeDefined();
        $httpBackend.flush();
    }));

    it('query with default params should add parameter abc=1', inject(function($httpBackend) {
        var promise, resource, defaultParamsConfig = {};

        $httpBackend.expectGET('/nested/1234/test?abc=1').respond(200, {nested_test: {abc: 'xyz'}});

        angular.copy(nestedConfig, defaultParamsConfig);
        defaultParamsConfig.defaultParams = {abc: '1'};

        resource = factory(defaultParamsConfig);
        expect(promise = resource.query(null, {nestedId: 1234})).toBeDefined();

        $httpBackend.flush();
    }));

    it('get should return resource object when response is 200', inject(function($httpBackend) {
        var promise, result;

        $httpBackend.expectGET('/nested/1234/test/123').respond(200, {nested_test: {id: 123, abc: 'xyz'}});

        expect(promise = NestedTest.get({nestedId: 1234, id: 123})).toBeDefined();

        promise.then(function (response) {
            result = response;
        });

        $httpBackend.flush();

        expect(result).toBeInstanceOf(NestedTest);
        expect(result).toEqualData({id: 123, abc: 'xyz'});
    }));

    it('get should call failure callback when 404', inject(function($httpBackend) {
        var promise, success = false, failure = false;

        $httpBackend.expectGET('/nested/1234/test/123').respond(404);

        expect(promise = NestedTest.get({nestedId: 1234, id: 123})).toBeDefined();

        promise.then(function () {
            success = true;
        }, function () {
            failure = true;
        });

        $httpBackend.flush();

        expect(success).toBe(false);
        expect(failure).toBe(true);
    }));

    it('get with default params should add parameter abc=1', inject(function($httpBackend) {
        var promise, resource, defaultParamsConfig = {};

        $httpBackend.expectGET('/nested/1234/test/123?abc=1').respond(200, {nested_test: {abc: 'xyz'}});

        angular.copy(nestedConfig, defaultParamsConfig);
        defaultParamsConfig.defaultParams = {abc: '1'};

        resource = factory(defaultParamsConfig);
        expect(promise = resource.get({nestedId: 1234, id: 123})).toBeDefined();

        $httpBackend.flush();
    }));

    it('should be able to create new instance and save it', inject(function($httpBackend) {
        var data = new NestedTest({nestedId: 1234, abcDef: 'xyz'});

        $httpBackend.expectPOST('/nested/1234/test', {nested_test: {nested_id: 1234, abc_def: 'xyz'}}).respond(200, {nested_test: {id: 123, nested_id: 1234, abc_def: 'xyz'}});
        data.nestedId = 1234;
        data.create();
        $httpBackend.flush();

        expect(data).toEqualData({id: 123, nestedId: 1234, abcDef: 'xyz'});
    }));

    it('should be able to create new instance and update it', inject(function($httpBackend) {
        var data = new NestedTest({abcDef: 'xyz'});

        $httpBackend.expectPOST('/nested/1234/test', {nested_test: {abc_def: 'xyz', nested_id: 1234}}).respond(200, {nested_test: {id: 123, nested_id: 1234, abc_def: 'xyz'}});
        data.nestedId = 1234;
        data.create();
        $httpBackend.flush(1);

        expect(data).toEqualData({id: 123, nestedId: 1234, abcDef: 'xyz'});

        $httpBackend.expectPUT('/nested/1234/test/123', {nested_test: {abc_def: 'xyz', nested_id: 1234, id: 123, xyz: 'abc'}}).respond(200, {nested_test: {id: 123, nested_id: 1234, abc_def: 'xyz', xyz: 'abc', extra: 'test'}});
        data.xyz = 'abc';
        data.update();
        $httpBackend.flush();

        expect(data).toEqualData({id: 123, nestedId: 1234, abcDef: 'xyz', xyz: 'abc', extra: 'test'});
    }));

    it('create with default params should add parameter abc=1', inject(function($httpBackend) {
        var promise, Resource, data, defaultParamsConfig = {};

        $httpBackend.expectPOST('/nested/1234/test?abc=1', {nested_test: {nested_id: 1234}}).respond(200, {nested_test: {id: 123, nested_id: 1234}});

        angular.copy(nestedConfig, defaultParamsConfig);
        defaultParamsConfig.defaultParams = {abc: '1'};

        Resource = factory(defaultParamsConfig);
        data = new Resource();
        data.nestedId = 1234;
        data.create();

        $httpBackend.flush();
    }));

    it('should be able to get resource and update it', inject(function($httpBackend) {
        var promise, result;

        $httpBackend.expectGET('/nested/1234/test/123').respond(200, {nested_test: {id: 123, nested_id: 1234, abc: 'xyz'}});

        expect(promise = NestedTest.get({nestedId: 1234, id: 123})).toBeDefined();

        promise.then(function (response) {
            result = response;
        });

        $httpBackend.flush();

        expect(result).toBeInstanceOf(NestedTest);
        expect(result).toEqualData({id: 123, nestedId: 1234, abc: 'xyz'});

        $httpBackend.expectPUT('/nested/1234/test/123', {nested_test: {id: 123, nested_id: 1234, abc: 'xyz', xyz: 'abc'}}).respond(200, {nested_test: {id: 123, nested_id: 1234, abc_def: 'xyz', xyz: 'abc', extra: 'test'}});
        result.xyz = 'abc';
        result.update();
        $httpBackend.flush();

        // abc was originally set on the object so it should still be there after the update
        expect(result).toEqualData({id: 123, nestedId: 1234, abc: 'xyz', abcDef: 'xyz', xyz: 'abc', extra: 'test'});
    }));

    it('update should handle 204 response', inject(function($httpBackend) {
        var promise, result;

        $httpBackend.expectGET('/nested/1234/test/123').respond(200, {nested_test: {id: 123, nested_id: 1234, abc: 'xyz'}});

        expect(promise = NestedTest.get({nestedId: 1234, id: 123})).toBeDefined();

        promise.then(function (response) {
            result = response;
        });

        $httpBackend.flush();

        expect(result).toBeInstanceOf(NestedTest);
        expect(result).toEqualData({id: 123, nestedId: 1234, abc: 'xyz'});

        $httpBackend.expectPUT('/nested/1234/test/123', {nested_test: {id: 123, nested_id: 1234, abc: 'xyz', xyz: 'abc'}}).respond(204);
        result.xyz = 'abc';
        result.update();
        $httpBackend.flush();

        expect(result).toEqualData({id: 123, nestedId: 1234, abc: 'xyz', xyz: 'abc'});
    }));

    it('should be able to delete instance returned from get', inject(function($httpBackend) {
        var promise, result;

        $httpBackend.expectGET('/nested/1234/test/123').respond(200, {nested_test: {id: 123, nestedId: 1234, abc: 'xyz'}});

        expect(promise = NestedTest.get({nestedId: 1234, id: 123})).toBeDefined();

        promise.then(function (response) {
            result = response;
        });

        $httpBackend.flush();

        expect(result).toBeInstanceOf(NestedTest);
        expect(result).toEqualData({id: 123, nestedId: 1234, abc: 'xyz'});

        $httpBackend.expectDELETE('/nested/1234/test/123').respond(204);
        result.remove();
        $httpBackend.flush();
    }));

    it('should be able to create new instance and delete it', inject(function($httpBackend) {
        var data = new NestedTest({abcDef: 'xyz'});

        $httpBackend.expectPOST('/nested/1234/test', {nested_test: {abc_def: 'xyz', nested_id: 1234}}).respond(200, {nested_test: {id: 123, nested_id: 1234, abc_def: 'xyz'}});
        data.nestedId = 1234;
        data.create();
        $httpBackend.flush(1);

        expect(data).toEqualData({id: 123, nestedId: 1234, abcDef: 'xyz'});
        expect(data).toBeInstanceOf(NestedTest);

        $httpBackend.expectDELETE('/nested/1234/test/123').respond(204);
        data.remove();
        $httpBackend.flush();
    }));

    it('delete with default params should add parameter abc=1', inject(function($httpBackend) {
        var Resource, data, defaultParamsConfig = {};

        $httpBackend.expectDELETE('/nested/1234/test/123?abc=1').respond(204);

        angular.copy(nestedConfig, defaultParamsConfig);
        defaultParamsConfig.defaultParams = {abc: '1'};

        Resource = factory(defaultParamsConfig);
        data = new Resource();
        data.id = 123;
        data.nestedId = 1234;
        data.remove();

        $httpBackend.flush();
    }));
});
