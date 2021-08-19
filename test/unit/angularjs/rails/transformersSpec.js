describe('deprecated request transformers', function () {
    'use strict';
    var $httpBackend, $rootScope, factory, Test, testTransformer,
        config = {
            url: '/test',
            name: 'test'
        };

    beforeEach(function() {
        module('rails');

        angular.module('rails').factory('railsTestTransformer', function () {
            return function (data, resource) {
                data.transformer_called = true;
                return data;
            }
        });
    });

    beforeEach(inject(function (_$httpBackend_, _$rootScope_, railsResourceFactory, railsTestTransformer) {
        $httpBackend = _$httpBackend_;
        $rootScope = _$rootScope_;
        factory = railsResourceFactory;
        Test = railsResourceFactory(config);
        testTransformer = railsTestTransformer;
    }));

    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('should be able to add transformer using name', function() {
        var Resource, testConfig = {};

        $httpBackend.expectPOST('/test/123', {test: {id: 123, transformer_called: true}}).respond(200, {id: 123, abc_def: 'xyz'});

        angular.copy(config, testConfig);
        testConfig.requestTransformers = ['railsTestTransformer'];
        Resource = factory(testConfig);
        new Resource({id: 123}).create();

        $httpBackend.flush();
    });

    it('should be able to add transformer using reference', function() {
        var Resource, testConfig = {};

        $httpBackend.expectPOST('/test/123', {test: {id: 123, transformer_called: true}}).respond(200, {id: 123, abc_def: 'xyz'});

        angular.copy(config, testConfig);
        testConfig.requestTransformers = [testTransformer];
        Resource = factory(testConfig);
        new Resource({id: 123}).create();

        $httpBackend.flush();
    });

    it('should call transformer function with beforeRequest', function () {
        var Resource, transformerCalled = false;

        $httpBackend.expectPOST('/test/123', {test: {id: 123}}).respond(200, {id: 123, abc_def: 'xyz'});

        Resource = factory(config);
        Resource.beforeRequest(function (data, constructor) {
            expect(data).toEqualData({id: 123});
            expect(constructor).toEqual(Resource);
            transformerCalled = true;
        });

        new Resource({id: 123}).create();

        $httpBackend.flush();
        expect(transformerCalled).toBeTruthy();
    });

    it('should be able to return new data from beforeRequest function', function () {
        var Resource, transformerCalled = false;

        $httpBackend.expectPOST('/test/123', {test: {id: 1}}).respond(200, {id: 123, abc_def: 'xyz'});

        Resource = factory(config);
        Resource.beforeRequest(function (data, resource) {
            expect(data).toEqualData({id: 123});
            expect(resource).toEqual(Resource);
            transformerCalled = true;
            return {id: 1};
        });

        new Resource({id: 123}).create();

        $httpBackend.flush();
        expect(transformerCalled).toBeTruthy();
    });
});
