module.exports = function(config) {
  config.set({
    basePath: '.',
    autoWatch: true,
    browsers: ['Chrome'],
    frameworks: ['jasmine'],
    reporters: ['progress', 'junit'],
    files: [
      'node_modules/angular/angular.js',
      'node_modules/angular-mocks/angular-mocks.js',
      'vendor/assets/javascripts/angularjs/rails/resource/index.js',
      'vendor/assets/javascripts/angularjs/rails/resource/**/*.js',
      'test/unit/**/*.js'
    ],
    junitReporter: {
        outputFile: 'test_out/unit.xml',
        suite: 'unit'
    }
  })
};