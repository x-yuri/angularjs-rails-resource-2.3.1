# AngularJS Rails Resource
[![Build Status](https://travis-ci.org/FineLinePrototyping/angularjs-rails-resource.png)](https://travis-ci.org/FineLinePrototyping/angularjs-rails-resource)

A resource factory inspired by $resource from AngularJS and [Misko's recommendation](http://stackoverflow.com/questions/11850025/recommended-way-of-getting-data-from-the-server).

## Differences from $resource
This library is not a drop in replacement for $resource.  There are significant differences that you should be aware of:

1.  <code>get</code> and <code>query</code> return [$q promises](http://docs.angularjs.org/api/ng.$q), not an instance or array that will be populated.  To gain access to the results you
should use the promise <code>then</code> function.
2.  By default we perform root wrapping and unwrapping (if wrapped) when communicating with the server.
3.  By default we convert attribute names between underscore and camel case.

## FAQs
### How come I can't iterate the array returned from query?
We don't return an array.  We return promises not arrays or objects that get filled in later.

If you need access to the array in your JS code you can use the promise <code>then</code> function:
````javascript
Book.query({title: 'Moby Dick'}).then(function (books) {
    $scope.books = books;
});
````

### I like underscores, how can I turn off the name conversion?
You can inject the <code>railsSerializerProvider</code> into your application config function and override the <code>underscore</code>
and <code>camelize</code> functions:
````javascript
angular.module('app').config(["railsSerializerProvider", function(railsSerializerProvider) {
    railsSerializerProvider.underscore(angular.identity).camelize(angular.identity);
}]);
````

## Installation
### Rails Asset Pipeline
Add this line to your application's Gemfile to use the latest stable version:
```ruby
gem 'angularjs-rails-resource', '~> 2.0.0'
```

Include the javascript somewhere in your asset pipeline:
```javascript
//= require angularjs/rails/resource
```

To add extensions just add additional requires:
```javascript
//= require angularjs/rails/resource/extensions/snapshots
```
### JavaScript package managers

Install via [npm](https://www.npmjs.com/package/angularjs-rails-resource): `npm install angularjs-rails-resource`

Install via [Bower](http://bower.io): `bower install angularjs-rails-resource --save`

### Standalone
If you aren't using the Rails asset pipeline you can download the combined
[angularjs-rails-resource.js](https://github.com/FineLinePrototyping/dist-angularjs-rails-resource/blob/master/angularjs-rails-resource.js)
or [angularjs-rails-resource.min.js](https://github.com/FineLinePrototyping/dist-angularjs-rails-resource/blob/master/angularjs-rails-resource.min.js).

You can also use [Bower](http://bower.io/) to install <code>angularjs-rails-resource</code>.

## Branching and Versioning
As much as possible we will try to adhere to the [SemVer](http://semver.org/) guidelines on release numbering.

The master branch may contain work in progress and should not be considered stable.

Release branches should remain stable but it is always best to rely on the ruby gem release versions as the most stable versions.

## Changes
Make sure to check the [CHANGELOG](CHANGELOG.md) for any breaking changes between releases.

## Usage
There are a lot of different ways that you can use the resources and we try not to force you into any specific pattern.
All of the functionality is packed in an AngularJS module named "rails" so make sure that your modules depend on that module
for the dependency injection to work properly.

There are more examples available in [EXAMPLES.md](EXAMPLES.md).

### Defining Resources
There are multiple ways that you can set up define new resources in your application.

#### railsResourceFactory
Similar to $resource, we provide a <code>railsResourceFactory(config)</code> function that takes a config object with the configuration
settings for the new resource.  The factory function returns a new class that is extended from RailsResource.

```javascript
angular.module('book.services', ['rails']);
angular.module('book.services').factory('Book', ['railsResourceFactory', function (railsResourceFactory) {
    return railsResourceFactory({
        url: '/books',
        name: 'book'
    });
}]);
```

#### RailsResource extension
We also expose the RailsResource as base class that you can extend to create your own resource classes.  Extending the RailsResource class
directly gives you a bit more flexibility to add custom constructor code.  There are probably ten different ways to extend the class but
the two that we intend to be used are through CoffeeScript or through the same logic that the factory function uses.

##### CoffeeScript
To allow better integration with CoffeeScript, we expose the RailsResource as a base class that can be extended to create
resource classes.  When extending RailsResource you should use the <code>@configure</code> function to set configuration
properties for the resource.  You can call <code>@configure</code> multiple times to set additional properties as well.

````coffeescript
class Book extends RailsResource
  @configure url: '/books', name: 'book'

class Encyclopedia extends Book
  @configure url: '/encyclopedias', name: 'encyclopedia'
````

**NOTE:** Always call <code>@configure()</code> in subclasses, even when no configuration is required.
This is important to prevent overriding the parent's configuration with interceptors, etc (especially when using a module mixin pattern).

##### JavaScript
Since the purpose of exposing the RailsResource was to allow for CoffeeScript users to create classes from it the JavaScript way
is basically just the same as the generated CoffeeScript code.  The <code>RailsResource.extendTo</code> function is a modification
of the <code>__extends</code> function that CoffeeScript generates.

````javascript
function Resource() {
    Resource.__super__.constructor.apply(this, arguments);
}

RailsResource.extendTo(Resource);
Resource.configure(config);
````
##### ES6
The code currently does not export any module information but it can be imported using the 'load with side-effects' method.
This efectively runs through the code and makes the whole module available. Because we don't have an export to assign 
the name 'rails' to a variable, we call in the angular module as a string, for example :
````javascript
// Import angular
import angular                  from 'angular';
import 'angular-animate'
import 'angular-aria'
// Materail Design lib
import material                 from 'angular-material';
// Router
import angularUIRouter          from 'angular-ui-router';
import ngTokenAuth              from 'ng-token-auth';
// Note no 'from'
import  'angularjs-rails-resource';

import Configurations           from './configuration/module';
import SignIn                   from './devise/signIn/module';
import Models                   from './model/module';

const testAppModule = angular.module( 'testApp',
    [   material,
        ngTokenAuth,
        ngStorage.name,
        angularUIRouter,
        'rails'
        ])
````
If you use ES6 classes to set up the model, the railsResourceFactory should be returned from the constructor, for example :

````javascript
class Client {
    constructor(railsResourceFactory,){
        return railsResourceFactory({
            url: "/clients",
            name: "client"
        });
    }
    clientMethod1(){
        
    };
    
    clientMethod2(){
        
    };

}

Client.$inject = ['railsResourceFactory'];

export default Client
````
The model classes can then be gathered up in a separate module.js or index.js file, for example :
````javascript

import Client               from './Client'
import User                 from './User'
import Blog                 from './Blog'

export default angular
    .module('model', [])
    .service('Client', Client)
    .service('User', User)
    .service('Blog', Blog)
````


### Using Resources
```javascript
angular.module('book.controllers').controller('BookShelfCtrl', ['$scope', 'Book', function ($scope, Book) {
    $scope.searching = true;
    $scope.books = [];

    // Find all books matching the title
    Book.query({ title: title }).then(function (results) {
        $scope.books = results;
        $scope.searching = false;
    }, function (error) {
        // do something about the error
        $scope.searching = false;
    });

    // Find a single book and update it
    Book.get(1234).then(function (book) {
        book.lastViewed = new Date();
        book.update();
    });

    // Create a book and save it
    new Book({
        title: 'Gardens of the Moon',
        author: 'Steven Erikson',
        isbn: '0-553-81957-7'
    }).create();
}]);
```

### Custom Serialization
When defining a resource, you can pass a custom [serializer](#serializers) using the <code>serializer</code> configuration option to
alter the behavior of the object serialization.
```javascript
Author = railsResourceFactory({
    url: '/authors',
    name: 'author',
    serializer: railsSerializer(function () {
        this.exclude('birthDate', 'books');
        this.nestedAttribute('books');
        this.resource('books', 'Book');
    })
});
```
You can also specify a serializer as a factory and inject it as a dependency.
```javascript
angular.module('rails').factory('BookSerializer', function (railsSerializer) {
    return railsSerializer(function () {
        this.exclude('publicationDate', 'relatedBooks');
        this.rename('ISBN', 'isbn');
        this.nestedAttribute('chapters', 'notes');
        this.serializeWith('chapters', 'ChapterSerializer');
        this.add('numChapters', function (book) {
            return book.chapters.length;
        });
    });
});

Book = railsResourceFactory({
    url: '/books',
    name: 'book',
    serializer: 'BookSerializer'
});
```


### Config Options

The following configuration options are available for customizing resources.  Each of the configuration options can be passed as part of an object
to the <code>railsResourceFactory</code> function or to the resource's <code>configure</code> function.  The <code>configure</code> function
defined on the resource can be called multiple times to adjust properties as needed.

 * **url** - This is the url of the service.  See [Resource URLs](#resource-urls) below for more information.
 * **rootWrapping** - (Default: true) Turns on/off root wrapping on JSON (de)serialization.
 * **name** - This is the name used for root wrapping when dealing with singular instances.
 * **pluralName** *(optional)* - If specified this name will be used for unwrapping array results.  If not specified then the serializer's [pluralize](#serializers) method is used to calculate
        the plural name from the singular name.
 * **idAttribute** *(optional)* - (Default: 'id') Configures what field on the record represents the unique identifier.
 * **httpConfig** *(optional)* - By default we will add the following headers to ensure that the request is processed as JSON by Rails. You can specify additional http config options or override any of the defaults by setting this property.  See the [AngularJS $http API](http://docs.angularjs.org/api/ng.$http) for more information.
     * **headers**
         * **Accept** - application/json
         * **Content-Type** - application/json
 * **defaultParams** *(optional)* - If the resource expects a default set of query params on every call you can specify them here.
 * **underscoreParams** *(optional)* - Controls whether or not query parameters are converted from camel case to underscore.
 * **updateMethod** *(optional)* - Allows overriding the default HTTP method (PUT) used for update.  Valid values are "post", "put", or "patch".
 * **serializer** *(optional)* - Allows specifying a custom [serializer](#serializers) to configure custom serialization options.
 * **fullResponse** *(optional)* - When set to true promises will return full $http responses instead of just the response data.
 * **singular** - (Default: false) Treat this as a [singular resource](http://guides.rubyonrails.org/routing.html#singular-resources).
 * **interceptors** *(optional)* - See [Interceptors](#interceptors)
 * **extensions** *(optional)* - See [Extensions](#extensions)

**Deprecated:**
 * **requestTransformers** *(optional)* - See [Transformers / Interceptors](#transformers--interceptors)
 * **responseInterceptors** *(optional)* - See [Transformers / Interceptors](#transformers--interceptors)
 * **afterResponseInterceptors** *(optional)* - See [Transformers / Interceptors](#transformers--interceptors)

**NOTE:** The names should be specified using camel case when using the key transformations because that happens before the root wrapping by default.
For example, you should specify "publishingCompany" and "publishingCompanies" instead of "publishing_company" and "publishing_companies".

### Provider Configuration
<code>RailsResource</code> can be injected as <code>RailsResourceProvider</code> into your app's config method to configure defaults for all the resources application-wide.
The individual resource configuration takes precedence over application-wide default configuration values.
Each configuration option listed is exposed as a method on the provider that takes the configuration value as the parameter and returns the provider to allow method chaining.

* rootWrapping - {function(boolean):RailsResourceProvider}
* httpConfig - {function(object):RailsResourceProvider}
* defaultParams - {function(object):RailsResourceProvider}
* underscoreParams - {function(boolean):RailsResourceProvider}
* updateMethod - {function(boolean):RailsResourceProvider}
* fullResponse - {function(boolean):RailsResourceProvider}
* extensions - {function(...string):RailsResourceProvider}

For example, to turn off the root wrapping application-wide and set the update method to PATCH:

````javascript
app.config(function (RailsResourceProvider) {
    RailsResourceProvider.rootWrapping(false).updateMethod('patch');
);
````

## Resource URLs
The URL can be specified as one of three ways:

 1. function (context) - You can pass your own custom function that converts a context variable into a url string

 2. basic string - A string without any expression variables will be treated as a base URL and assumed that instance requests should append id to the end.

 3. AngularJS expression - An expression url is evaluated at run time based on the given context for non-instance methods or the instance itself. For example, given the url expression: `/stores/{{storeId}}/items/{{id}}`

```javascript
Item.query({category: 'Software'}, {storeId: 123}) // would generate a GET to /stores/123/items?category=Software
Item.get({storeId: 123, id: 1}) // would generate a GET to /stores/123/items/1

new Item({store: 123}).create() // would generate a POST to /stores/123/items
new Item({id: 1, storeId: 123}).update() // would generate a PUT to /stores/123/items/1
```

## Promises
[$http documentation](http://docs.angularjs.org/api/ng.$http) describes the promise data very well so I highly recommend reading that.

In addition to the fields listed in the $http documentation an additional field named originalData is added to the response
object to keep track of what the field was originally pointing to.  The originalData is not a deep copy, it just ensures
that if response.data is reassigned that there's still a pointer to the original response.data object.

### Canceling Requests
The promises returned from this library have an extra ```abort``` function defined that will allow you to cancel an outstanding request. Canceling the request will trigger timeout on ```$http``` which will in turn reject the outstanding promise. We wrap the ```$q``` promise to ensure that every time you chain the promise we re-add the ```abort``` function to the new promise.

For example, the following code would abort the query request after the 5 second timeout:
```javascript
var promise = Item.query({category: 'Software'}, {storeId: 123});
$timeout(promise.abort, 5000);
```

## Resource Methods
RailsResources have the following class methods available.

### Class Methods
* Constructor(data) - The Resource object can act as a constructor function for use with the JavaScript <code>new</code> keyword.
    * **data** {object} (optional) - Optional data to set on the new instance

* configure(options) - Change one or more configuration option for a resource.

* extendTo(child) - Modifies the child to be a subclass of a RailsResource.  This can be used to create multiple levels of inheritance. See [RailsResource extension](#RailsResource-extension) for more information

* include(...module) - Includes a mixin module into the resource.  See [Mixins](#mixins) for more information

* setUrl(url) - Updates the url for the resource, same as calling <code>configure({url: url})</code>

* $url(context, path) - Returns the resource URL using the given context with the optional path appended if provided.
    * **context** {*} - The context to use when building the url.  See [Resource URLs](#resource-urls) above for more information.
    * **path** {string} (optional) - A path to append to the resource's URL.
    * **returns** {string} - The resource URL

* query(queryParams, context) - Executes a GET request against the resource's base url (e.g. /books).
    * **query params** {object} (optional) - An map of strings or objects that are passed to $http to be turned into query parameters
    * **context** {*} (optional) - A context object that is used during url evaluation to resolve expression variables
    * **returns** {promise} - A promise that will be resolved with an array of new Resource instances

* get(context) - Executes a GET request against the resource's url (e.g. /books/1234).
    * **context** {*} - A context object that is used during url evaluation to resolve expression variables.  If you are using a basic url this can be an id number to append to the url.
    * **returns** {promise} A promise that will be resolved with a new instance of the Resource

* $get(customUrl, queryParams) - Executes a GET request against the given URL.
    * **customUrl** {string} - The url to GET
    * **queryParams** {object} (optional) - The set of query parameters to include in the GET request
    * **returns** {promise} A promise that will be resolved with a new Resource instance (or instances in the case of an array response).

* $post/$put/$patch(customUrl, data, resourceConfigOverrides, queryParams) - Serializes the data parameter using the Resource's normal serialization process and submits the result as a POST / PUT / PATCH to the given URL.
    * **customUrl** {string} - The url to POST / PUT / PATCH to
    * **data** {object} - The data to serialize and POST / PUT / PATCH
    * **resourceConfigOverrides** {object} (optional) - An optional set of RailsResource configuration option overrides to use for this request. Root wrapping and serialization for the request data can be bypassed using the `skipRequestProcessing` flag. This also bypasses the entire pre-request [interceptor](#interceptors) chain.
    * **queryParams** {object} (optional) - The set of query parameters to include in the request
    * **returns** {promise} A promise that will be resolved with a new Resource instance (or instances in the case of an array response).

* $delete(customUrl, queryParams) - Executes a DELETE to a custom URL.  The main difference between this and $http.delete is that a server response that contains a body will be deserialized using the normal Resource deserialization process.
    * **customUrl** {string} - The url to DELETE to
    * **queryParams** {object} (optional) - The set of query parameters to include in the DELETE request
    * **returns** {promise} A promise that will be resolved with a new Resource instance (or instances in the case of an array response) if the server includes a response body.

* $http(httpConfig, context, resourceConfigOverrides) - Executes an HTTP operation specified by the config.  The request data is serialized and root wrapped (if configured).  The response data is unwrapped (if configured) and deserialized and copied to the context object if specified.
  * **httpConfig** {object} - Standard $http config object.
  * **context** {object} - The instance that the operation is being run against.
  * **resourceConfigOverrides** {object} (optional) - An optional set of RailsResource configuration option overrides to use for this request. Root wrapping and serialization for the request data can be bypassed using the `skipRequestProcessing` flag. This also bypasses the entire pre-request [interceptor](#interceptors) chain.

* addInterceptor(interceptor) - Adds an interceptor to the resource class.
  * **interceptor** {object | string} - See [Interceptors](#interceptors) for details of object format.

* intercept(phase, callback) - Creates an interceptor for the specified phase and adds it to the resource's interceptor list.  The callback function will be executed when the interceptor phase is run.  If the callback function returns a value that will take the place of the value going forward in the promise chain.
  * **phase** {string} - The interceptor phase, see [Interceptors](#interceptors) for a list of phases.
  * **callback** {function(value, resourceConstructor, context)} - The callback function to execute.  The value parameter varies based on the phase.  See [Interceptors](#interceptors) for details.  The resourceConstructor is the resource's constructor function.  The context is the resource instance that operation is running against which may be undefined.
* interceptBeforeRequest(callback) - Shortcut for intercept('beforeRequest', callback)
* interceptBeforeRequestWrapping(callback) - Shortcut for intercept('beforeRequestWrapping', callback)
* interceptRequest(callback) - Shortcut for intercept('request', callback)
* interceptBeforeResponse(callback) - Shortcut for intercept('beforeResponse', callback)
* interceptBeforeResponseDeserialize(callback) - Shortcut for intercept('beforeResponseDeserialize', callback)
* interceptResponse - Shortcut for intercept('response', callback)
* interceptAfterResponse - Shortcut for intercept('afterResponse', callback)

**Deprecated**
* beforeRequest(fn(data, resource)) - See [Interceptors](#interceptors) for more information.  The function is called prior to the serialization process so the data
passed to the function is still a Resource instance as long as another transformation function has not returned a new object to serialize.
    * fn(data, resource) {function} - The function to add as a transformer.
        * **data** {object} - The data being serialized
        * **resource** {Resource class} - The Resource class that is calling the function
        * **returns** {object | undefined} - If the function returns a new object that object will instead be used for serialization.

* beforeResponse(fn(data, resource, context)) - See [Interceptors](#interceptors) for more information.  The function is called after the response data has been unwrapped and deserialized.
    * fn(data, resource, context) {function} - The function to add as an interceptor
        * **data** {object} - The data received from the server
        * **resource** {Resource function} - The Resource constructor that is calling the function
        * **context** {Resource|undefined} - The Resource instance that is calling the function or undefined if called from a class level method (get, query).

* afterResponse(fn(data, resource, context)) - See [Interceptors](#interceptors) for more information.  This function is called after all internal processing and beforeResponse callbacks have been completed.
    * fn(data, resource) {function} - The function to add as an interceptor
        * **data** {object} - The result, either an array of resource instances or a single resource instance.
        * **resource** {Resource function} - The Resource constructor that is calling the function

* afterDeserialize(fn(data, resource, context)) - See [Interceptors](#interceptors) for more information.  This function is called after a resource (including assocations) has been deserialized.
    * fn(data, resource) {function} - The function to add as an interceptor
        * **data** {object} - The result, either an array of resource instances or a single resource instance.
        * **resource** {Resource function} - The Resource constructor that is calling the function

### Instance Methods
The instance methods can be used on any instance (created manually or returned in a promise response) of a resource.
All of the instance methods will update the instance in-place on response and will resolve the promise with the current instance.

* $url(path) - Returns this Resource instance's URL with the optional path appended if provided.
    * **path** {string} (optional) - A path to append to the resource's URL.

* get() - Refreshes the instance from the server.
    * **returns** {promise} - A promise that will be resolved with the instance itself

* create() - Submits the resource instance to the resource's base URL (e.g. /books) using a POST
    * **returns** {promise} - A promise that will be resolved with the instance itself

* update() - Submits the resource instance to the resource's URL (e.g. /books/1234) using a PUT
    * **returns** {promise} - A promise that will be resolved with the instance itself

* save() - Calls <code>create</code> if <code>isNew</code> returns true, otherwise it calls <code>update</code>.

* remove(), delete() - Executes an HTTP DELETE against the resource's URL (e.g. /books/1234)
    * **returns** {promise} - A promise that will be resolved with the instance itself

* $http(httpConfig, resourceConfigOverrides) - Executes class method $http with the resource instance as the operation context.

* $post(customUrl, context, queryParams), $put(customUrl, context, queryParams), $patch(customUrl, context, queryParams) - Serializes and submits the instance using an HTTP POST/PUT/PATCH to the given URL.
    * **customUrl** {string} - The url to POST / PUT / PATCH to
    * **context** {object} - The instance that the operation is being run against.
    * **queryParams** {object} (optional) - The set of query parameters to include in the POST / PUT / PATCH request
    * **returns** {promise} - A promise that will be resolved with the instance itself

* $delete(customUrl, queryParams) - Executes a DELETE to a custom URL.  The main difference between this and $http.delete is that a server response that contains a body will be deserialized using the normal Resource deserialization process.
    * **customUrl** {string} - The url to DELETE to
    * **queryParams** {object} (optional) - The set of query parameters to include in the DELETE request
    * **returns** {promise} - A promise that will be resolved with the instance itself


## Serializers
Out of the box, resources serialize all available keys and transform key names between camel case and underscores to match Ruby conventions.
However, that basic serialization often isn't ideal in every situation.  With the serializers users can define customizations
that dictate how serialization and deserialization is performed.  Users can: rename attributes, specify extra attributes, exclude attributes
with the ability to exclude all attributes by default and only serialize ones explicitly allowed, specify other serializers to use
for an attribute and even specify that an attribute is a nested resource.

AngularJS automatically excludes all attribute keys that begin with $ in their toJson code.

### railsSerializer
* railsSerializer(options, customizer) - Builds a Serializer constructor function using the configuration options specified.
    * **options** {object} (optional) - Configuration options to alter the default operation of the serializers.  This parameter can be excluded and the
    customizer function specified as the first argument instead.
    * **customizer** {function} (optional) - A function that will be called to customize the serialization logic.
    * **returns** {Serializer} - A Serializer constructor function

### Configuration
The <code>railsSerializer</code> function takes a customizer function that is called on create within the context of the constructed Serializer.
From within the customizer function you can call customization functions that affect what gets serialized and how or override the default options.

#### Configuration Options
Serializers have the following available configuration options:
* underscore - (function) Allows users to supply their own custom underscore conversion logic.
    * **default**: RailsInflector.underscore
    * parameters
        * **attribute** {string} - The current name of the attribute
    * **returns** {string} - The name as it should appear in the JSON
* camelize - (function) Allows users to supply their own custom camelization logic.
    * **default**: RailsInflector.camelize
    * parameters
        * **attribute** {string} - The name as it appeared in the JSON
    * **returns** {string} - The name as it should appear in the resource
* pluralize - (function) Allows users to supply their own custom pluralization logic.
    * default: RailsInflector.pluralize
    * parameters
        * **attribute** {string} - The name as it appeared in the JSON
    * **returns** {string} - The name as it should appear in the resource
* exclusionMatchers {array} - An list of rules that should be applied to determine whether or not an attribute should be excluded.  The values in the array can be one of the following types:
    * string - Defines a prefix that is used to test for exclusion
    * RegExp - A custom regular expression that is tested against the attribute name
    * function - A custom function that accepts a string argument and returns a boolean with true indicating exclusion.

#### Provider Configuration
<code>railsSerializer</code> can be injected as <code>railsSerializerProvider</code> into your app's config method to configure defaults for all the serializers application-wide.
Each configuration option listed is exposed as a method on the provider that takes the configuration value as the parameter and returns the provider to allow method chaining.

* underscore - {function(fn):railsSerializerProvider}
* camelize - {function(fn):railsSerializerProvider}
* pluralize - {function(fn):railsSerializerProvider}
* exclusionMatchers - {function(matchers):railsSerializerProvider}


#### Customization API
The customizer function passed to the railsSerializer has available to it the following methods for altering the serialization of an object.  None of these methods support nested attribute names (e.g. <code>'books.publicationDate'</code>), in order to customize the serialization of the <code>books</code> objects you would need to specify a custom serializer for the <code>books</code> attribute.

* exclude (attributeName...) - Accepts a variable list of attribute names to exclude from JSON serialization.  This has no impact on what is deserialized from the server.

* only (attributeName...) - Accepts a variable list of attribute names that should be included in JSON serialization.  This has no impact on what is deserialized from the server.  Using this method will by default exclude all other attributes and only the ones explicitly included using <code>only</code> will be serialized.

* rename (javascriptName, jsonName) - Specifies a custom name mapping for an attribute.  On serializing to JSON the <code>jsonName</code> will be used.  On deserialization, if <code>jsonName</code> is seen then it will be renamed as javascriptName in the resulting resource.  Right now it is still passed to underscore so you could do 'publicationDate' -> 'releaseDate' and it will still underscore as release_date.  However, that may be changed to prevent underscore from breaking some custom name that it doesn't handle properly.

* nestedAttribute (attributeName...) - This is a shortcut for rename that allows you to specify a variable number of attributes that should all be renamed to <code><name>_attributes</code> to work with the Rails nested_attributes feature.  This does not perform any additional logic to accommodate specifying the <code>_destroy</code> property.

* resource (attributeName, resource, serializer) - Specifies an attribute that is a nested resource within the parent object.  Nested resources do not imply nested attributes, if you want both you still have to specify call <code>nestedAttribute</code> as well.  A nested resource serves two purposes.  First, it defines the resource that should be used when constructing resources from the server.  Second, it specifies how the nested object should be serialized.  An optional third parameter <code>serializer</code> is available to override the serialization logic of the resource in case you need to serialize it differently in multiple contexts.

* add (attributeName, value) - Allows custom attribute creation as part of the serialization to JSON.  The parameter <code>value</code> can be defined as function that takes a parameter of the containing object and returns a value that should be included in the JSON.

* serializeWith (attributeName, serializer) - Specifies a custom serializer that should be used for the attribute.  The serializer can be specified either as a <code>string</code> reference to a registered service or as a Serializer constructor returned from <code>railsSerializer</code>

* polymorphic (attributeName...) - Specifies a polymorphic association according to Rails' standards. Polymorphic associations have a <code>{name}_id</code> and <code>{name}_type</code> columns in the database. The <code>{name}_type</code> attribute will specify which resource will be used to serialize and deserialize the data.

### Serializer Methods
The serializers are defined using mostly instance prototype methods.  For information on those methods please see the inline documentation.  There are however a couple of class methods that
are also defined to expose underscore, camelize, and pluralize.  Those functions are set to the value specified by the configuration options sent to the serializer.

## Interceptors
The entire request / response processing is configured as a [$q promise chain](http://docs.angularjs.org/api/ng.$q).  Interceptors allow inserting additional synchronous or asynchronous processing at various phases in the request / response cycle.  The flexibility of the synchronous or asynchronous promise resolution allows any number of customizations to be built.  For instance, on response you could load additional data before returning that the current response is complete.  Or, you could listen to multiple phases and set a flag that a save operation is in progress in <code>beforeRequest</code> and then in <code>afterResponse</code> and <code>afterResponseError</code> you could clear the flag.

Interceptors are similar in design to the $http interceptors.  You can add interceptors via the <code>RailsResource.addInterceptor</code> method or by explicitly adding them to the <code>interceptors</code> array on the on the resource <code>config</code> object.  When you add the interceptor, you can add it using either the interceptor service factory name or the object reference.  An interceptor should contain a set of keys representing one of the valid phases and the callback function for the phase.

There are several phases for both request and response to give users and mixins more flexibility for exactly where they want to insert a customization.  Each phase also has a corresponding error phase which is the phase name appended with Error (e.g. beforeResponse and beforeResponseError).  The error phases receive the current rejection value which in most cases would be the error returned from $http.  Since these are $q promises, your interceptor can decide whether or not to propagate the error or recover from it.  If you want to propagate the error, you must return a <code>$q.reject(reason)</code> result.  Otherwise any value you return will be treated as a successful value to use for the rest of the chain.  For instance, in the <code>beforeResponseError</code> phase you could attempt to recover by using an alternate URL for the request data and return the new promise as the result.

Each request phase interceptor is called with the $http config object, the resource constructor, and if applicable the resource instance.  The interceptor is free to modify the config or create a new one.  The interceptor function must return a valid $http config or a promise that will eventually resolve to a config object.

The valid request phases are:

 * beforeRequest: Interceptors are called prior to any data serialization or root wrapping.
 * beforeRequestError: Interceptors get called when a previous interceptor threw an error or resolved with a rejection.
 * beforeRequestWrapping: Interceptors are called after data serialization but before root wrapping.
 * beforeRequestWrappingError: Interceptors get called when a previous interceptor threw an error or resolved with a rejection.
 * request:  Interceptors are called after any data serialization and root wrapping have been performed.
 * requestError: Interceptors get called when a previous interceptor threw an error or resolved with a rejection.

The beforeResponse and response interceptors are called with the $http response object, the resource constructor, and if applicable the resource instance.  The afterResponse interceptors are typically called with the response data instead of the full response object unless the config option fullResponse has been set to true.  Like the request interceptor callbacks the response callbacks can manipulate the data or return new data.  The interceptor function must return

 The valid response phases are:

 * beforeResponse: Interceptors are called prior to any data processing.
 * beforeResponseError: Interceptors get called when a previous interceptor threw an error or resolved with a rejection.
 * beforeResponseDeserialize: Interceptors are called after root unwrapping but prior to data deserializing.
 * beforeResponseDeserializeError: Interceptors get called when a previous interceptor threw an error or resolved with a rejection.
 * response:  Interceptors are called after the data has been deserialized and root unwrapped but prior to the data being copied to the resource instance if applicable.
 * responseError: Interceptors get called when a previous interceptor threw an error or resolved with a rejection.
 * afterResponse:  Interceptors are called at the very end of the response chain after all processing
      has been completed.  The value of the first parameter is one of the following:
       - resource instance: When fullResponse is false and the operation was called on a resource instance.
       - response data: When fullResponse is false and the operation was called on the resource class.
       - $http response: When fullResponse is true
 * afterResponseError: Interceptors get called when a previous interceptor threw an error or resolved with a rejection.

### Example Interceptor
```javascript
angular.module('rails').factory('saveIndicatorInterceptor', function () {
    return {
        'beforeRequest': function (httpConfig, resourceConstructor, context) {
            if (context && (httpConfig.method === 'post' || httpConfig.method === 'put')) {
                context.savePending = true;
            }
            return httpConfig;
        },
        'afterResponse': function (result, resourceConstructor, context) {
            if (context) {
                context.savePending = false;
            }
            return result;
        },
        'afterResponseError': function (rejection, resourceConstructor, context) {
            if (context) {
                context.savePending = false;
            }
            return $q.reject(rejection);
        }
    };
});
```

## Transformers / Interceptors (**DEPRECATED**)
The transformers and interceptors can be specified using an array containing transformer/interceptor functions or strings
that can be resolved using Angular's DI.  The transformers / interceptors concept was prior to the [serializers](#serializers) but
we kept the API available because there may be use cases that can be accomplished with these but not the serializers.

### Request Transformers
Transformer functions are called to transform the data before we send it to $http for POST/PUT.

A transformer function is called with two parameters:
* data - The data that is being sent to the server
* resource - The resource class that is calling the transformer

A transformer function must return the data.  This is to allow transformers to return entirely new objects in place of the current data (such as root wrapping).

The resource also exposes a class method <code>beforeRequest(fn)</code> that accepts a function to execute and automatically wraps it as a transformer and appends it
to the list of transformers for the resource class.  The function passed to <code>beforeRequest</code> is called with the same two parameters.  One difference
is that the functions are not required to return the data, though they still can if they need to return a new object.  See [example](EXAMPLES.md#specifying-transformer).

### Response Interceptors
Interceptor functions utilize [$q promises](http://docs.angularjs.org/api/ng.$q) to process the data returned from the server.

The interceptor is called with the promise returned from $http and is expected to return a promise for chaining.  The promise passed to each
interceptor contains two additional properties:
  * **resource** - The Resource constructor function for the resource calling the interceptor
  * **context** - The Resource instance if applicable (create, update, delete) calling the interceptor

Each interceptor promise is expected to return the response or a $q.reject.  See [Promises](#promises) for more information about the promise data.

The resource also exposes a class method <code>beforeResponse(fn)</code> that accepts a function to execute and automatically wraps it as an interceptor and appends it
to the list of interceptors for the resource class.  Functions added with <code>beforeResponse</code> don't need to know anything about promises since they are automatically wrapped
as an interceptor.

### After Response Interceptors
After response interceptors are called after all processing and response interceptors have completed.  An after response interceptor is analogous to
chaining a promise after the resource method call but is instead for all methods.

The after response interceptors are called with the final processing promise and is expected to return a promise for chaining.  The promise is resolved
with the result of the operation which will be either a resource instance or an array of resource instances.  The promise passed to the interceptor
has the following additional property:
 * **resource** - The Resource constructor function for the resource calling the interceptor

The resource also exposes a class method <code>afterResponse(fn)</code> that accepts a function to execute and automatically wraps it as an interceptor and appends it
to the list of after response interceptors for the resource class.  Functions added with <code>afterResponse</code> don't need to know anything about promises since they are automatically wrapped
as an interceptor.

## Mixins
The ability to add a [Mixin](http://en.wikipedia.org/wiki/Mixin) to a RailsResource is modeled after the example code in
in the [Classes](http://arcturo.github.io/library/coffeescript/03_classes.html) chapter of [The Little Book on CoffeeScript](http://arcturo.github.io/library/coffeescript/index.html).

RailsResource provides two methods:
* **extend** - Add class properties / methods to the resource
* **include** - Add instance properties / methods to the resource prototype chain

When you call <code>extend</code> or <code>include</code> the mixin will be added to the resource.  If your mixin provides
one of the callback methods (<code>extended</code> or <code>included</code>) then those methods will be called when the mixin
is added.  One additional change from the normal mixin behavior is that your mixins can implement an additional <code>configure</code>
function that will be called whenever the resource's <code>configure</code> function is called.  That way the mixin can provide
additional configuration options.

## Extensions
Extensions are provided [mixins](#mixins) that follow specific naming pattern to make it easier to include them by a shortened name.

The available extension names are:
 * [snapshots](#snapshots) - RailsResourceSnapshotsMixin

To include an extension, you have to first include the extension in your project.
You then need to add the extension to the in one of the following ways to RailsResource:

### Application-wide Resource Extensions
<code>RailsResourceProvider.extensions</code> - adds the extension to all RailsResources within the application.
````javascript
app.config(function (RailsResourceProvider) {
    RailsResourceProvider.extensions('snapshots');
});
````

### Per-Resource Extensions
#### Configuration Option
The <code>extensions</code> configuration option adds the extension to a single RailsResource

##### JavaScript
````javascript
Book = railsResourceFactory({
    url: '/books',
    name: 'book',
    extensions: ['snapshots']
});
````
##### CoffeeScript
````coffeescript
class Book extends RailsResource
  @configure url: '/books', name: 'book', extensions: ['snapshots']
````

#### RailsResource.extend
RailsResource.extend - explicitly include the extension as a module

##### JavaScript
````javascript
Book = railsResourceFactory({ url: '/books', name: 'book' });
// by name
Book.extend('RailsResourceSnapshotsMixin');
// or by injected reference
Book.extend(RailsResourceSnapshotsMixin);
````

##### CoffeeScript

````coffeescript
class Book extends RailsResource
  @configure url: '/books', name: 'book'
  @extend 'RailsResourceSnapshotsMixin'
````

### Snapshots
Snapshots allow you to save off the state of the resource at a specific point in time and if need be roll back to one of the
saved snapshots and yes, you can create as many snapshots as you want.

Snapshots serialize the resource instance and save off a copy of the serialized data in the <code>$$snapshots</code> array on the instance.
If you use a custom serialization options to control what is sent to the server you may want to consider whether or not you want to use
different serialization options.  If so, you can specify an specific serializer for snapshots using the <code>snapshotSerializer</code> configuration
option.

Calling <code>save</code>, <code>create</code>, <code>update</code>, or <code>delete</code>/<code>remove</code> on a resource instance
will remove all snapshots when the operation completes successfully.

#### Configuration Options
 * **snapshotSerializer** *(optional)* - Allows specifying a custom [serializer](#serializers) to configure custom serialization options specific to [snapshot and rollback](#snapshots).


#### Creating Snapshots
Creating a snapshot is easy, just call the <code>snapshot</code> function.  You can pass an optional callback function to <code>snapshot</code> to perform
additional custom operations after the rollback is complete.   The callback function is specific to each snapshot version created so make sure you pass it every
time if it's a callback you always want called.

#### Rolling back
So you want to undo changes to the resource?  There are two methods you can use to roll back the resource to a previous snapshot version <code>rollback</code>
and <code>rollbackTo</code>.  Each method will:
 * Deserialize the snapshot data and update the resource instance with the new data.
 * Remove all snapshots newer than the version being rolled back to.
 * Call the rollback callback if it was specified on the <code>snapshot</code> in the context of the resource instance.

##### rollback
<code>rollback(numVersions)</code> allows you to roll back the resource.  If you do not specify <code>numVersions</code> then a resource is rolled back to the last
snapshot version.  <code>numVersions</code> can be used to roll back further than the last snapshot version based on the following rules:

* When <code>numVersions</code> is undefined or 0 then a single version is rolled back.
* When <code>numVersions</code> exceeds the stored number of snapshots then the resource is rolled back to the first snapshot version.
* When <code>numVersions</code> is less than 0 then the resource is rolled back to the first snapshot version.
* Otherwise, <code>numVersions</code> represents the nth version from the last snapshot version (similar to calling rollback <code>numVersions</code> times).

##### rollbackTo
<code>rollbackTo(snapshotVersion)</code> allows you to roll back the resource to a specific snapshot version.

* When <code>snapshotVersion</code> is greater than the number of versions then the last snapshot version will be used.
* When <code>snapshotVersion</code> is less than 0 then the resource will be rolled back to the first version.
* Otherwise, the resource will be rolled back to the specific version specified.

##### unsnappedChanges
`unsnappedChanges()` checks to see if the resource has been changed since its last snapshot

* If there are no snapshots, returns `true`
* If all properties considered by `angular.equals` match the latest snapshot, returns `false`;
  otherwise, returns `true`
* (Note that `angular.equals` [does not consider $-prefixed properties](https://docs.angularjs.org/api/ng/function/angular.equals))

## Tests
The tests are written using [Jasmine](http://pivotal.github.com/jasmine/) and are run using [Karma](https://github.com/karma-runner/karma).

Running the tests should be as simple as following the [instructions](https://github.com/karma-runner/karma)

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Added some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request

## License
Copyright (c) 2012 - 2017 [FineLine Prototyping, Inc.](http://www.finelineprototyping.com)

MIT License

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
