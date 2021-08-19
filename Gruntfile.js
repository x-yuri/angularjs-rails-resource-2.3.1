module.exports = function(grunt) {
  var path = require('path');

  var srcFolder = 'vendor/assets/javascripts/angularjs/rails/resource/',
      srcFiles = ["index.js", "utils/**/*.js", "serialization.js", "resource.js"].map(function(glob) {
        return srcFolder + glob;
      }),
      extensionFiles = ["extensions/**/*.js"].map(function(glob) {
          return srcFolder + glob;
      });

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    meta: {
      banner: '/**\n' +
      ' * <%= pkg.description %>\n' +
      ' * @version v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
      ' * @link <%= pkg.homepage %>\n' +
      ' * @author <%= pkg.author %>\n' +
      ' */\n'
    },

    dirs: {
      dest: 'dist'
    },

    clean: ['<%= dirs.dest %>'],

    copy: {
      extensions: {
        files: [
          {expand: true, flatten: true, src: extensionFiles, dest: '<%= dirs.dest %>/extensions'}
        ]
      }
    },

    concat: {
      options: {
        banner: "<%= meta.banner %>"
      },
      dist: {
        src: srcFiles,
        dest: '<%= dirs.dest %>/<%= pkg.name %>.js',
        options: {
          process: function(src, filepath) {
            return src.replace(/^\/\/= require.*\n/gm, '');
          }
        }
      }
    },

    compress: {
      dist: {
        options: {
          archive: '<%= dirs.dest %>/angularjs-rails-resource.zip'
        },
        files: [
          {expand: true, cwd: '<%= dirs.dest %>', src: ['**/*.js']}
        ]
      }
    },

    uglify: {
      options: {
        banner: "<%= meta.banner %>"
      },
      dist: {
        files: [
          {expand: true, cwd: '<%= dirs.dest %>', src: ['**/*.js'], dest: '<%= dirs.dest %>', ext: '.min.js'}
        ]
      }
    },

    jshint: {
      files: ['gruntfile.js'].concat(srcFiles),
      options: {
        // options here to override JSHint defaults
        globals: {
          angular: true
        }
      }
    },

    bump: {
      options: {
        files: ['package.json', 'bower.json'],
        commit: false,
        createTag: false,
        push: false
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-bump');

  grunt.registerTask('default', ['jshint', 'clean', 'concat', 'copy', 'uglify', 'compress']);
};
