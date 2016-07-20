// Karma configuration
// Generated on Sat Oct 24 2015 20:19:49 GMT+0300 (MSK)
///<reference path="./typings/tsd.d.ts"/>

module.exports = function(config: any): void {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['commonjs', 'mocha', 'chai', 'chai-as-promised'],

    // list of files / patterns to load in the browser
    files: [
      './node_modules/phantomjs-polyfill/bind-polyfill.js',
      './node_modules/promise-polyfill/promise.js',
      './node_modules/jquery/dist/jquery.js',
      './node_modules/underscore/underscore.js',
      './node_modules/backbone/backbone.js',
      './node_modules/backbone.ribs/backbone.ribs.js',
      './tmp/src/**/*.js',
      './tmp/tests/performance/**/*performance.js',
      './tmp/tests/performance/index.js'
    ],

    // list of files to exclude
    exclude: [
      './src/**/*.d.ts'
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      './tmp/**/*.js': ['commonjs']
    },

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
    autoWatch: false,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultanous
    concurrency: Infinity,

    browserNoActivityTimeout: 1000000
  });
};
