'use strict';

var gulp = require('gulp');
var glob = require('glob-all');
var path = require('path');
var _ = require('lodash');

var conf = {};

function findBase(a, b, l) {
  if (a === b) return a;

  l = l ? l - 1 : (a.length > b.length ? b.length : a.length);

  return findBase(a.substr(0, l), b.substr(0, l), l);
}

function createTask(task) {
  if (!task['dependencies'] && !task['task'])
    throw new Error('Tasks must either have dependencies or a task function!');

  gulp.task(task['name'], task['dependencies'], task['task']);
}

function loadTask(base) {
  return function (file) {
    var r = path.relative(base, file);
    var f = path.join(process.cwd(), file);
    var b = path.basename(r);
    var d = path.dirname(r);
    var e = path.extname(b);
    var x = require(f);
    var t = {};
    var c = {};

    if (x['config'])
      if (_.isFunction(x['config']))
        c = x['config'](_.cloneDeep(conf));
      else
        c = _.merge({}, conf, x['config']);
    else
      c = _.merge({}, conf);

    if (x['name'])
      if (_.isFunction(x['name']))
        t['name'] = (function (fn) {
          var r;
          this.config = c;
          r = fn.call(this);
          c = this.config;

          return r;
        })(x['name']);
      else
        t['name'] = x['name'];
    else
      t['name'] = (d === '.' ? '' : d.replace(path.sep, ':') + ':') + path.basename(b, e);

    if (x['dependencies'])
      if (_.isFunction(x['dependencies']))
        t['dependencies'] = (function (fn) {
          var r;
          this.config = c;
          r = fn.call(this);
          c = this.config;

          return r;
        })(x['dependencies']);
      else
        t['dependencies'] = x['dependencies'];

    if (t['dependencies'] && !_.isArray(t['dependencies']))
      t['dependencies'] = [t['dependencies']];

    if (_.isFunction(x['task']))
      t['task'] = (function (fn) {
        var f = function (next) {
          console.log('fx');
          var r;
          this.config = c;
          r = fn.apply(this, arguments);
          c = this.config;

          return r;
        };

        if (fn.length === 1) return function (a) {
          return f.apply(this, arguments);
        };
        else return function () {
          return f.apply(this, arguments);
        };
      })(x['task']);
    else if (_.isFunction(x))
      t['task'] = (function (fn) {
        var f = function (next) {
          console.log('fx');
          var r;
          this.config = c;
          r = fn.apply(this, arguments);
          c = this.config;

          return r;
        };

        if (fn.length === 1) return function (a) {
          return f.apply(this, arguments);
        };
        else return function () {
          return f.apply(this, arguments);
        };
      })(x);

    createTask(t);
  };
}

var Bootstrap = {

  /**
   * Merge `cfg` into the current configuration.
   *
   * @param {Object} cfg A configuration object
   * @returns {Bootstrap}
   */
  config: function (cfg) {
    conf = _.merge({}, conf, cfg);

    return this;
  },

  /**
   * Load tasks from paths.
   *
   * @param {string|string[]} paths A path or an array of paths
   * @returns {Bootstrap}
   */
  loadTasks: function (paths) {
    if (!Array.isArray(paths))
      paths = [paths];

    var files = glob.sync(paths).sort();
    var base = files.reduce(function (a, b) {
      return findBase(a, b);
    });

    if (files.length === 1) {
      base = path.dirname(base);
    }

    files.forEach(loadTask(base));

    return this;
  }

};

module.exports = Bootstrap;
