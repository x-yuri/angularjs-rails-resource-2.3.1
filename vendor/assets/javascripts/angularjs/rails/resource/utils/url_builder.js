/**
 * @ngdoc function
 * @name rails.railsUrlBuilder
 * @function
 * @requires $interpolate
 *
 * @description
 *
 * Compiles a URL template string into an interpolation function using $interpolate.  If no interpolation bindings
 * found then {{id}} is appended to the url string.
 *
   <pre>
       expect(railsUrlBuilder('/books')()).toEqual('/books')
       expect(railsUrlBuilder('/books')({id: 1})).toEqual('/books/1')
       expect(railsUrlBuilder('/authors/{{authorId}}/books/{{id}}')({id: 1, authorId: 2})).toEqual('/authors/2/books/1')
   </pre>
 *
 * If the $interpolate startSymbol and endSymbol have been customized those values should be used instead of {{ and }}
 *
 * @param {string|function} url If the url is a function then that function is returned.  Otherwise the url string
 *    is passed to $interpolate as an expression.
 *
 * @returns {function(context)} As stated by $interpolate documentation:
 *    An interpolation function which is used to compute the interpolated
 *    string. The function has these parameters:
 *
 *    * `context`: an object against which any expressions embedded in the strings are evaluated
 *      against.
 *
 */
(function (undefined) {
    angular.module('rails').factory('railsUrlBuilder', ['$interpolate', function($interpolate) {
        return function (config) {
            var url = config.url,
              idAttribute = config.idAttribute,
              expression;

            if (angular.isFunction(url) || angular.isUndefined(url)) {
                return url;
            }

            if (!config.singular && url.indexOf($interpolate.startSymbol()) === -1) {
                url = url + '/' + $interpolate.startSymbol() + idAttribute + $interpolate.endSymbol();
            }

            expression = $interpolate(url);

            return function (params) {
                url = expression(params);

                if (url.charAt(url.length - 1) === '/') {
                    url = url.substr(0, url.length - 1);
                }

                return url;
            };
        };
    }]);
}());
