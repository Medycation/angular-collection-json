module.exports = function(config) {
  'use strict';
  var testTargets = [
    'lib/client.coffee',
    'lib/attributes/*.coffee',
    'lib/utils/*.coffee',
  ], testFiles;

  if (process.env.TEST_TARGETS) {
    testTargets = process.env.TEST_TARGETS.split(':');
  }

  testFiles = [].concat([
    'bower_components/angular/angular.js',
    'bower_components/angular-mocks/angular-mocks.js',
    'bower_components/lodash/dist/lodash.underscore.js'
  ],
  testTargets,
  [
    'test/fixtures/*.js',
    'test/**/*.coffee'
  ]);

  config.set({

    frameworks: ['jasmine'],

    reportSlowerThan: 50,

    files: testFiles,

    exclude: [
      'test/acceptance/**/*'
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      '**/*.coffee': ['coffee']
    },

    coffeePreprocessor: {
      options: {
        bare: true,
        sourceMap: false
      },
      // transforming the filenames
      transformPath: function(path) {
        return path.replace(/\.coffee$/, '.js');
      }
    },

    plugins: [
      'karma-phantomjs-launcher',
      'karma-jasmine',
      'karma-coffee-preprocessor'
    ],


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['PhantomJS'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  });
};
