'use strict';

var gulp = require('gulp');
var glob = require('glob-all');
var path = require('path');

var conf = {};

function isArray(x) {
  return Array.isArray(x);
}

function isObject(x) {
  return typeof x === 'object';
}

function isFunction(x) {
  return typeof x === 'function';
}

function clone(source) {
  var obj = isArray(source) ? [] : {};

  for (var prop in source)
    if (source.hasOwnProperty(prop))
      if (isArray(source[prop]) || isObject(source[prop]))
        obj[prop] = clone(source[prop]);
      else
        obj[prop] = source[prop];

  return obj;
}

function merge(dest, source) {
  var obj = clone(dest);

  for (var prop in source)
    if (source.hasOwnProperty(prop))
      if (!obj[prop])
        obj[prop] = source[prop];
      else if (isArray(obj[prop]) && isArray(source[prop]))
        obj[prop] = obj[prop].concat(source[prop]);
      else if (isObject(source[prop]) && isObject(obj[prop]))
        obj[prop] = merge(obj[prop], source[prop]);
      else
        obj[prop] = source[prop];

  return obj;
}

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

    if (x['config'])
      if (isFunction(x['config']))
        t['config'] = x['config'](conf);
      else
        t['config'] = merge(conf, x['config']);
    else
      t['config'] = merge({}, conf);

    if (x['name'])
      if (isFunction(x['name']))
        t['name'] = x['name']();
      else
        t['name'] = merge(conf, x['config']);
    else
      t['name'] = (d === '.' ? '' : d.replace(path.sep, ':') + ':') + path.basename(b, e);

    if (x['task'])
      t['task'] = x['task'];

    if (x['dependencies'])
      t['dependencies'] = x['dependencies'];

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
    conf = merge(conf, cfg);

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

    files.forEach(loadTask(base));

    return this;
  }

};

module.exports = Bootstrap;
