# Defining a nested resource
If a resource returns nested objects then those are normally treated as just basic JavaScript objects stored on the resource instance.
Using the serializers we can specify that a nested object is in fact a resouce and the object(s) will be constructed as a resource
instance during deserialization.

For example, suppose we have an Author that serializes all of the books that author has written.  If we specify that the books
are a nested resource that allows us to more easily perform updates against those books without having to worry about creating
a resource instance for the book.

	angular.module('book.services', ['rails']);

	angular.module('book.services').factory('Book', ['railsResourceFactory', function (railsResourceFactory) {
		return railsResourceFactory({url: '/books', name: 'book'});
	}]);

	angular.module('book.services').factory('Author', ['railsResourceFactory', 'railsSerializer', function (railsResourceFactory, railsSerializer) {
		return railsResourceFactory({
			url: '/authors',
			name: 'author',
			serializer: railsSerializer(function () {
				this.resource('books', 'Book');
			})
		});
	}]);

	angular.module('book.controllers').controller('AuthorCtrl', ['$scope', 'Author', function ($scope, Author) {
		$scope.author = Author.get(123);

		// allow the view to trigger an update to a book from $scope.author.books
		$scope.updateBook = function (book) {
			book.update();
		}
	}]);

# Nested attributes
While we don't have logic for full nested attributes support, the new serializer does allow you to specify which fields
should be passed with the <code>_attributes</code> suffix.

	angular.module('book.services').factory('Book', ['railsResourceFactory', 'railsSerializer', function (railsResourceFactory, railsSerializer) {
		return railsResourceFactory({
			url: '/books',
			name: 'book',
			serializer: railsSerializer(function () {
				this.nestedAttribute('author');
			})
		});
	}]);

# Excluding attributes from serialization
Sometimes you don't want to serialize certain fields when updating an object.  Take for instance the case of the author on a book.
We know that we don't accept nested attributes for the author on the server so we want to exclude it from the JSON to reduce
the amount of data being sent to the server.

	angular.module('book.services').factory('Book', ['railsResourceFactory', 'railsSerializer', function (railsResourceFactory railsSerializer) {
		return railsResourceFactory({
			url: '/books',
			name: 'book',
			serializer: railsSerializer(function () {
				this.exclude('author');
			})
		});
	}]);


# Only allowing specific attributes for serialization
You can also be very restrictive and only include specific attributes that you want to send to the server.  All other attribtues
would be excluded by default.

	angular.module('book.services').factory('Book', ['railsResourceFactory', 'railsSerializer', function (railsResourceFactory. railsSerializer) {
		return railsResourceFactory({
			url: '/books',
			name: 'book',
			serializer: railsSerializer(function () {
				this.only('id', 'isbn', 'publicationDate');
			})
		});
	}]);


# Adding custom methods to a resource
You can add additional "class" or "instance" methods by modifying the resource returned from the factory call.

## Custom class-level find
For instance, if you wanted to add a method that would search for Books by the title without having to construct the query params
each time you could add a new <code>findByTitle</code> class function.

	angular.module('book.services', ['rails']);
	angular.module('book.services').factory('Book', ['railsResourceFactory', function (railsResourceFactory) {
		var resource = railsResourceFactory({url: '/books', name: 'book'});
		resource.findByTitle = function (title) {
			return resource.query({title: title});
		};
		return resource;
	}]);

	angular.module('book.controllers').controller('BookShelfCtrl', ['$scope', 'Book', function ($scope, Book) {
		$scope.searching = true;
		// Find all books matching the title
		$scope.books = Book.findByTitle({title: title});
		$scope.books.then(function(results) {
			$scope.searching = false;
		}, function (error) {
			$scope.searching = false;
		});
	}]);

## Get related object
You can also add additional methods on the object prototype chain so all instances of the resource have that function available.
The following example exposes a <code>getAuthor</code> instance method that would be accessible on all Book instances.

	angular.module('book.services', ['rails']);
	angular.module('book.services').factory('Author', ['railsResourceFactory', function (railsResourceFactory) {
		return railsResourceFactory({url: '/authors', name: 'author'});
	}]);
	angular.module('book.services').factory('Book', ['railsResourceFactory', 'Author', function (railsResourceFactory, Author) {
		var resource = railsResourceFactory({url: '/books', name: 'book'});
		resource.prototype.getAuthor = function () {
			return Author.get(this.authorId);
		};
		return resource;
	}]);
	angular.module('book.controllers').controller('BookShelfCtrl', ['$scope', 'Book', function ($scope, Book) {
		$scope.getAuthorDetails = function (book) {
			$scope.author = book.getAuthor();
		};
	}]);

## Nested URL
Or say you instead had a nested "references" service call that returned a list of referenced books for a given book instance.  In that case you can add your own addition method that calls $http.get and then
passes the resulting promise to the processResponse method which will perform the same transformations and handling that the get or query would use.

	angular.module('book.services', ['rails']);
	angular.module('book.services').factory('Book', ['railsResourceFactory', '$http', function (railsResourceFactory, $http) {
		var resource = railsResourceFactory({url: '/books', name: 'book'});
		resource.prototype.getReferences = function () {
			var self = this;
			return resource.$get(self.$url('references')).then(function (references) {
				self.references = references;
				return self.references;
			});
		};
	}]);

# Specifying Transformer
Transformers can be specified by an array of transformers in the configuration options passed to railsResourceFactory.
However, a cleaner way to write it is to use the <code>beforeRequest</code> which can take a new anonymous function or
a function returned by a factory if you want to share a transformer across multiple resources.

Both of these examples can be accomplished using the serializers now.

	angular.module('test').factory('excludePrivateKeysTransformer', function () {
		return function (data) {
			angular.forEach(data, function (value, key) {
				if (key[0] === '_') {
					delete data[key];
				}
			});
		});
	});

	angular.module('test').factory('Book', function (railsResourceFactory, excludePrivateKeysTransformer) {
		var Book = railsResourceFactory({url: '/books', name: 'book'});
		Book.beforeRequest(excludePrivateKeysTransformer);
		Book.beforeRequest(function (data) {
			data['release_date'] = data['publicationDate'];
			delete data['publicationDate'];
		});

		return Book;
	});


