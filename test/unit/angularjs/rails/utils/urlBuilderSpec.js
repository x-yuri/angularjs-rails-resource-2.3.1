describe("railsUrlBuilder", function () {
    'use strict';

    beforeEach(module('rails'));

    it('should return custom function', inject(function (railsUrlBuilder) {
        expect(railsUrlBuilder({
          url: function () { return 'test' }
        })()).toEqualData('test')
    }));

    it('should return base url when no context object', inject(function (railsUrlBuilder) {
        expect(railsUrlBuilder({
          url: '/books'
        })()).toEqualData('/books');
    }));

    it('should append id', inject(function (railsUrlBuilder) {
        expect(railsUrlBuilder({
          url: '/books',
          idAttribute: 'id'
        })({id: 1})).toEqualData('/books/1');
    }));

    it('should not append id when singular', inject(function (railsUrlBuilder) {
        expect(railsUrlBuilder({
          url: '/book',
          singular: true
        })()).toEqualData('/book');
    }));

    it('should use author id for book list', inject(function (railsUrlBuilder) {
        expect(railsUrlBuilder({
          url: '/authors/{{authorId}}/books/{{id}}',
          idAttribute: 'id'
        })({authorId: 1})).toEqualData('/authors/1/books');
    }));

    it('should use author id and book id', inject(function (railsUrlBuilder) {
        expect(railsUrlBuilder({
          url: '/authors/{{authorId}}/books/{{id}}',
          idAttribute: 'id'
        })({authorId: 1, id: 2})).toEqualData('/authors/1/books/2');
    }));

    describe('custom idAttribute', function () {
      it('should use different id attribute', inject(function (railsUrlBuilder) {
        expect(railsUrlBuilder({
          url: '/books',
          idAttribute: 'other_id'
        })({id: 1, other_id: 30})).toEqualData('/books/30');
      }));
    });

    describe('custom interpolation symbols', function() {
        beforeEach(module(function($interpolateProvider) {
              $interpolateProvider.startSymbol('--');
              $interpolateProvider.endSymbol('--');
        }));

        it('should append id', inject(function (railsUrlBuilder) {
            expect(railsUrlBuilder({
              url: '/books',
              idAttribute: 'id'
            })({id: 1})).toEqualData('/books/1');
        }));

        it('should use author id and book id', inject(function (railsUrlBuilder) {
            expect(railsUrlBuilder({
              url: '/authors/--authorId--/books/--id--',
              idAttribute: 'id'
            })({authorId: 1, id: 2})).toEqualData('/authors/1/books/2');
        }));
    });
});
