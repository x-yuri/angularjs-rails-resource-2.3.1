(function (undefined) {
    angular.module('rails').factory('RailsResourceInjector', ['$injector', function($injector) {
        /**
         * Allow dependencies to be referenced by name or instance.  If referenced by name AngularJS $injector
         * is used to retrieve the dependency.
         *
         * @param dependency (string | function) The dependency to retrieve
         * @returns {*} The dependency
         */
        function getDependency(dependency) {
            if (dependency) {
                return angular.isString(dependency) ? $injector.get(dependency) : dependency;
            }

            return undefined;
        }

        /**
         * Looks up and instantiates an instance of the requested service.  If the service is not a string then it is
         * assumed to be a constructor function.
         *
         * @param {String|function|Object} service  The service to instantiate
         * @returns {*} A new instance of the requested service
         */
        function createService(service) {
            if (service) {
                return $injector.instantiate(getDependency(service));
            }

            return undefined;
        }

        /**
         * Looks up and instantiates an instance of the requested service if .
         * @param {String|function|Object} service The service to instantiate
         * @returns {*}
         */
        function getService(service) {
            // strings and functions are not considered objects by angular.isObject()
            if (angular.isObject(service)) {
                return service;
            } else if (service) {
                return createService(service);
            }

            return undefined;
        }

        return {
            createService: createService,
            getService: getService,
            getDependency: getDependency
        };
    }]);
}());