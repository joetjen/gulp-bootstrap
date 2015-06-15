Always use strict

  'use strict';

Required needed libraries

  gulp = require 'gulp';



  gulp.task 'default', ['build']

  gulp.task 'build', () ->
    console.log 'building'
