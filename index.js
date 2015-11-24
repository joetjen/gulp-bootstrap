'use strict';

var glob = require('glob-all');
var path = require('path');
var _ = require('lodash');
var gulp = require('gulp-help')(require('gulp'), {
  hideEmpty: true
});

var conf = {};

module.exports = {
  /**
   *
   * @param cfg
   */
  config: function (cfg) {
    config.call(this, cfg);

    return this;
  },

  /**
   *
   * @param paths
   */
  loadTasks: function (paths) {
    loadTasks.call(this, paths);

    return this;
  }
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function config(cfg) {
  conf = _.merge({}, conf, cfg);
}

function loadTasks(paths) {
  if (!_.isArray(paths))
    paths = [paths];

  var files = glob.sync(paths).sort();
  var base = _.reduce(files, findBase);

  if (files.length === 1) base = path.dirname(base);

  files.forEach(loadTask(base));
}

function findBase(a, b) {
  return (function f(a, b, l) {
    if (a === b) return a;

    l = l ? l - 1 : (a.length > b.length ? b.length : a.length);

    return f(a.substr(0, l), b.substr(0, l), l);
  })(a, b);
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

    t = getProperty('dependencies', x, t, c);
    t = getProperty('help', x, t, c);
    t = getProperty('aliases', x, t, c);
    t = getProperty('options', x, t, c);

    if (t['dependencies'])
      t['dependencies'] = _.flatten([t['dependencies']]);

    if (_.isFunction(x['task']))
      t['task'] = (function (fn) {
        var f = function (next) {
          this.config = c;
          return fn.apply(this, arguments);
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
          this.config = c;
          return fn.apply(this, arguments);
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

function getProperty(prop, x, t, c) {
  if (x[prop])
    if (_.isFunction(x[prop]))
      t[prop] = x[prop].call({config: c});
    else
      t[prop] = x[prop];

  return t;
}

function createTask(task) {
  if (!task['dependencies'] && !task['task'])
    throw new Error('Tasks must either have dependencies or a task function!');

  var opts = {};

  if (task['aliases']) opts['aliases'] = task['aliases'];
  if (task['options']) opts['options'] = task['options'];

  var args = [
    task['name'],
    task['help'],
    task['dependencies'],
    task['task'],
    opts
  ];

  gulp.task.apply(gulp, args);
}
