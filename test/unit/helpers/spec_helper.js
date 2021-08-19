beforeEach(function () {
    this.addMatchers({
        toEqualData: function (expected) {
            return angular.equals(this.actual, expected);
        },
        toBeFunction: function () {
            return angular.isFunction(this.actual);
        },
        toBeInstanceOf: function (expected) {
            return this.actual instanceof expected;
        }

    });
});