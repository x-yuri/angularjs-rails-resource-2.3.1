describe('RailsResource.snapshots', function () {
    'use strict';
    var Book, $httpBackend, railsResourceFactory, railsSerializer;

    beforeEach(function () {
        module('rails')
    });

    beforeEach(inject(function (_$httpBackend_, _railsResourceFactory_, _railsSerializer_) {
        $httpBackend = _$httpBackend_;
        railsResourceFactory = _railsResourceFactory_;
        railsSerializer = _railsSerializer_;
        Book = railsResourceFactory({
            url: '/books',
            name: 'book',
            extensions: ['snapshots']
        });
    }));

    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('should store all keys', function () {
        var book, data = {id: 1, $key: '1234', name: 'The Winds of Winter'};
        book = new Book(data);
        expect(book.snapshot()).toBe(0);

        expect(book.$$snapshots).toBeDefined();
        expect(book.$$snapshots.length).toBe(1);
        expect(book.$$snapshots[0].$$snapshots).toBeUndefined();
        expect(book).toEqualData(data);
        expect(book.$$snapshots[0].$key).toBe('1234');
        expect(book.$$snapshots[0]).toEqualData(data);
    });

    it('should store deep copy', function () {
        var book, data = {
            id: 1,
            $key: '1234',
            name: 'The Winds of Winter',
            author: {
                id: 1,
                name: 'George R. R. Martin'
            }
        };

        book = new Book(data);
        book.snapshot();

        expect(book.$$snapshots[0].author).toBeDefined();
        expect(book.$$snapshots[0].author.id).toBe(1);
        expect(book.$$snapshots[0]).toEqualData(data);
    });

    it('should store multiple snapshots', function () {
        var book, data = {id: 1, $key: '1234', name: 'The Winds of Winter'};
        book = new Book(data);
        expect(book.snapshot()).toBe(0);
        book.$key = '1235';
        expect(book.snapshot()).toBe(1);
        book.$key = '1236';
        expect(book.snapshot()).toBe(2);

        expect(book.$$snapshots).toBeDefined();
        expect(book.$$snapshots.length).toBe(3);
        expect(book.$$snapshots[0].$key).toBe('1234');
        expect(book.$$snapshots[1].$key).toBe('1235');
        expect(book.$$snapshots[2].$key).toBe('1236');
    });

    it('should rollback single version', function () {
        var book, data = {id: 1, $key: '1234', name: 'The Winds of Winter'};
        book = new Book(data);
        book.snapshot();
        book.$key = '1235';
        book.snapshot();
        book.$key = '1236';
        book.rollback();

        expect(book.$key).toBe('1235');
        expect(book.$$snapshots).toBeDefined();
        expect(book.$$snapshots.length).toBe(1);
    });

    it('should rollback deep copy', function () {
        var book, data = {
            id: 1,
            $key: '1234',
            name: 'The Winds of Winter',
            author: {
                id: 1,
                name: 'George R. R. Martin'
            }
        };

        book = new Book(data);
        book.snapshot();
        book.author = {id: 2, name: 'Hugh Howey'};
        book.rollback();

        expect(book.author).toBeDefined();
        expect(book).toEqualData(data);

        book.snapshot();
        book.author.name = 'Hugh Howey';
        book.rollback();

        expect(book.author).toBeDefined();
        expect(book).toEqualData(data);
    });

    it('should not modify source nested object on rollback', function () {
        var book, hughHoweyAuthor = {id: 2, name: 'Hugh Howey'},
            data = {
            id: 1,
            $key: '1234',
            name: 'The Winds of Winter',
            author: {
                id: 1,
                name: 'George R. R. Martin'
            }
        };

        book = new Book(data);
        book.snapshot();
        book.author = hughHoweyAuthor;
        book.rollback();

        expect(hughHoweyAuthor).toEqualData({id: 2, name: 'Hugh Howey'});
    });


    it('should allow multiple rollbacks', function () {
        var book, data = {id: 1, $key: '1234', name: 'The Winds of Winter'};
        book = new Book(data);
        book.snapshot();
        book.$key = '1235';
        book.snapshot();
        book.$key = '1236';
        book.rollback();

        expect(book.$key).toBe('1235');
        expect(book.$$snapshots).toBeDefined();
        expect(book.$$snapshots.length).toBe(1);
        book.rollback();

        expect(book.$key).toBe('1234');
        expect(book.$$snapshots).toBeDefined();
        expect(book.$$snapshots.length).toBe(0);
    });


    it('should rollback specified number of versions', function () {
        var book, data = {id: 1, $key: '1234', name: 'The Winds of Winter'};
        book = new Book(data);
        book.snapshot();
        book.$key = '1235';
        book.snapshot();
        book.$key = '1236';
        book.snapshot();
        book.$key = '1237';
        book.rollback(2);

        expect(book.$key).toBe('1235');
        expect(book.$$snapshots).toBeDefined();
        expect(book.$$snapshots.length).toBe(1);
    });

    it('should not change resource on rollback if no snapshots saved', function () {
        var book, data = {id: 1, $key: '1234', name: 'The Winds of Winter'};
        book = new Book(data);
        book.$key = '1235';
        book.rollback();

        expect(book.$key).toBe('1235');
    });

    it('should roll back to the first snapshot for -1', function () {
        var book, data = {id: 1, $key: '1234', name: 'The Winds of Winter'};
        book = new Book(data);
        book.snapshot();
        book.$key = '1235';
        book.snapshot();
        book.$key = '1236';
        book.snapshot();
        book.rollback(-1);

        expect(book.$key).toBe('1234');
        expect(book.$$snapshots).toBeDefined();
        expect(book.$$snapshots.length).toBe(0);
    });

    it('should roll back to the first snapshot when versions exceeds available snapshots', function () {
        var book, data = {id: 1, $key: '1234', name: 'The Winds of Winter'};
        book = new Book(data);
        book.snapshot();
        book.$key = '1235';
        book.snapshot();
        book.$key = '1236';
        book.snapshot();
        book.rollback(1000);

        expect(book.$key).toBe('1234');
        expect(book.$$snapshots).toBeDefined();
        expect(book.$$snapshots.length).toBe(0);
    });

    it('should roll back to version in middle', function () {
        var book, data = {id: 1, $key: '1234', name: 'The Winds of Winter'};
        book = new Book(data);
        book.snapshot();
        book.$key = '1235';
        book.snapshot();
        book.$key = '1236';
        book.snapshot();
        book.rollbackTo(1);

        expect(book.$key).toBe('1235');
        expect(book.$$snapshots).toBeDefined();
        expect(book.$$snapshots.length).toBe(1);
    });

    it('should roll back to first version', function () {
        var book, data = {id: 1, $key: '1234', name: 'The Winds of Winter'};
        book = new Book(data);
        book.snapshot();
        book.$key = '1235';
        book.snapshot();
        book.$key = '1236';
        book.snapshot();
        book.rollbackTo(0);

        expect(book.$key).toBe('1234');
        expect(book.$$snapshots).toBeDefined();
        expect(book.$$snapshots.length).toBe(0);
    });

    it('should roll back to last version when version exceeds available versions', function () {
        var book, data = {id: 1, $key: '1234', name: 'The Winds of Winter'};
        book = new Book(data);
        book.snapshot();
        book.$key = '1235';
        book.snapshot();
        book.$key = '1236';
        book.snapshot();
        book.$key = '1237';
        book.rollbackTo(100);

        expect(book.$key).toBe('1236');
        expect(book.$$snapshots).toBeDefined();
        expect(book.$$snapshots.length).toBe(2);
    });

    it('should reset snapshots on create', function () {
        var book, data = {$key: '1234', name: 'The Winds of Winter'};
        book = new Book(data);
        book.snapshot();
        book.$key = '1235';

        $httpBackend.expectPOST('/books').respond(200, {book: {id: 1}});
        book.save();
        $httpBackend.flush();

        expect(book.$key).toBe('1235');
        expect(book.$$snapshots).toBeDefined();
        expect(book.$$snapshots.length).toBe(0);
    });

    it('should be able to save after rollback', function () {
        var book, data = {$key: '1234', name: 'The Winds of Winter'};
        book = new Book(data);
        book.snapshot();
        book.$key = '1235';
        book.rollback();

        $httpBackend.expectPOST('/books').respond(200, {book: {id: 1}});
        book.save();
        $httpBackend.flush();

        expect(book.$key).toBe('1234');
        expect(book.$$snapshots).toBeDefined();
        expect(book.$$snapshots.length).toBe(0);
    });

    it('should not submit $$snapshots', function () {
        var book, data = {id: 1, $key: '1234', name: 'The Winds of Winter'};
        book = new Book(data);
        book.snapshot();
        book.$key = '1235';

        $httpBackend.whenPUT('/books/1', function(putData) {
            var json = JSON.parse(putData);
            expect(json.book.$$snapshots).toBeUndefined();
            return true;
        }).respond(200, {book: {id: 1}});

        book.save();
        $httpBackend.flush();

        expect(book.$key).toBe('1235');
        expect(book.$$snapshots).toBeDefined();
        expect(book.$$snapshots.length).toBe(0);
    });

    it('should reset snapshots on update', function () {
        var book, data = {id: 1, $key: '1234', name: 'The Winds of Winter'};
        book = new Book(data);
        book.snapshot();
        book.$key = '1235';

        $httpBackend.expectPUT('/books/1').respond(200, {book: {id: 1}});
        book.save();
        $httpBackend.flush();

        expect(book.$key).toBe('1235');
        expect(book.$$snapshots).toBeDefined();
        expect(book.$$snapshots.length).toBe(0);
    });

    it('should reset snapshots on delete', function () {
        var book, data = {id: 1, $key: '1234', name: 'The Winds of Winter'};
        book = new Book(data);
        book.snapshot();
        book.$key = '1235';

        $httpBackend.expectDELETE('/books/1').respond(200, {book: {id: 1}});
        book.delete();
        $httpBackend.flush();

        expect(book.$key).toBe('1235');
        expect(book.$$snapshots).toBeDefined();
        expect(book.$$snapshots.length).toBe(0);
    });

    it('should call rollback callback on rollback', function () {
        var book, callbackCalled = false, data = {id: 1, $key: '1234', name: 'The Winds of Winter'};
        book = new Book(data);
        book.snapshot(function () {
            callbackCalled = true;
        });
        book.rollback();
        expect(callbackCalled).toBe(true);
    });

    it('should call correct rollback callback on each rollback', function () {
        var book, firstCallbackCalled = false, secondCallbackCalled = false,
            data = {id: 1, $key: '1234', name: 'The Winds of Winter'};
        book = new Book(data);
        book.snapshot(function () {
            firstCallbackCalled = true;
        });
        book.$key = '1235';
        book.snapshot(function () {
            secondCallbackCalled = true;
        });
        book.$key = '1236';

        book.rollback();
        expect(book.$key).toBe('1235');
        expect(firstCallbackCalled).toBe(false);
        expect(secondCallbackCalled).toBe(true);

        book.rollback();
        expect(book.$key).toBe('1234');
        expect(firstCallbackCalled).toBe(true);
        expect(secondCallbackCalled).toBe(true);
    });

    it('should detect unsnapped changes', function () {
        var book, data = {id: 1, $key: '1234', name: 'The Winds of Winter', theAuthor: 'George R.R. Martin'};
        book = new Book(data);
        expect(book.unsnappedChanges()).toBe(true);

        book.snapshot();
        expect(book.unsnappedChanges()).toBe(false);

        book.name = 'Harry Potter';
        expect(book.unsnappedChanges()).toBe(true);

        book.snapshot();
        expect(book.unsnappedChanges()).toBe(false);

        book.theAuthor = 'J.K. Rowling';
        expect(book.unsnappedChanges()).toBe(true);

        book.snapshot();
        expect(book.unsnappedChanges()).toBe(false);

        // angular.equals ignores $-prefixed properties
        book.$key = '1235'
        expect(book.unsnappedChanges()).toBe(false);
    });

    describe('serializer', function () {
        beforeEach(function () {
            Book.configure({
                serializer: railsSerializer(function () {
                    this.exclude('author');
                })
            });
        });

        it('should exclude author from snapshot and rollback', function () {
            var book, data = {
                id: 1,
                $key: '1234',
                name: 'The Winds of Winter',
                author: {
                    id: 1,
                    name: 'George R. R. Martin'
                }
            };

            book = new Book(data);
            book.snapshot();
            book.author.name = 'George Orwell';

            expect(book.$$snapshots[0].author).not.toBeDefined();
            expect(book.author).toEqualData({id: 1, name: 'George Orwell'});

            book.rollback();
            // should still be George Orwell since it wasn't snapshotted
            expect(book.author).toEqualData({id: 1, name: 'George Orwell'});
        });

    });

    describe('snapshotSerializer', function () {
        beforeEach(function () {
            Book.configure({
                serializer: railsSerializer(function () {
                    this.exclude('author');
                }),
                snapshotSerializer: railsSerializer(function () {
                    this.exclude('$key');
                })
            });
        });

        it('should include author and exclude $key from snapshot and rollback', function () {
            var book, data = {
                id: 1,
                $key: '1234',
                name: 'The Winds of Winter',
                author: {
                    id: 1,
                    name: 'George R. R. Martin'
                }
            };

            book = new Book(data);
            book.snapshot();
            book.$key = '1235';
            book.author.name = 'George Orwell';

            expect(book.$$snapshots[0].author).toBeDefined();
            expect(book.$$snapshots[0].$key).not.toBeDefined();
            expect(book.$key).toBe('1235');
            expect(book.author).toEqualData({id: 1, name: 'George Orwell'});

            book.rollback();
            // should be 1235 since it wasn't snapshotted
            expect(book.$key).toBe('1235');
            // should be George R. R. Martin since it was snapshotted
            expect(book.author).toEqualData({id: 1, name: 'George R. R. Martin'});
        });

    });
});