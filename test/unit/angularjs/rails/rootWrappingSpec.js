describe('root wrapping', function () {
    'use strict';

    beforeEach(module('rails'));

    var q, rootScope, railsRootWrapper, Resource;

    beforeEach(inject(function ($rootScope, $q, railsResourceFactory, _railsRootWrapper_) {
        q = $q;
        rootScope = $rootScope;
        Resource = railsResourceFactory({name: 'test', pluralName: 'tests'});
        railsRootWrapper = _railsRootWrapper_;
    }));

    it('should handle null root', function() {
        testTransform({test: null}, null);
    });

    it('should transform arrays', function() {
        testTransform({tests: [1, 2, 3]}, [1, 2, 3]);
    });

    it('should transform object', function() {
        testTransform({test: {abc: 'xyz', def: 'abc'}}, {abc: 'xyz', def: 'abc'});
    });

    it('should not unwrap pluralName when object is expected', function() {
        var data = {tests: [1, 2, 3], id: 4};
        expect(railsRootWrapper.unwrap({data: data}, Resource, true)).toEqualData({data: data});
    });

    function testTransform(wrappedData, unwrappedData) {
        expect(railsRootWrapper.wrap(unwrappedData, Resource)).toEqualData(wrappedData);
        expect(railsRootWrapper.unwrap({data: wrappedData}, Resource)).toEqualData({data: unwrappedData});
    }
});
