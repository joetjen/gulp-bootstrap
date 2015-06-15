'use strict';

var gulp = require('gulp');
var glob = require('glob-all');
var path = require('path');
var _ = require('underscore');

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

    if (x['config'])
      if (_.isFunction(x['config']))
        t['config'] = x['config'](conf);
      else
        t['config'] = _.defaults(x['config'], conf);
    else
      t['config'] = _.defaults({}, conf);

    if (x['name'])
      if (_.isFunction(x['name']))
        t['name'] = x['name']();
      else
        t['name'] = _.defaults(x['config'], conf);
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
    conf = _.extend(conf, cfg);

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

    console.log('found base', base);

    files.forEach(loadTask(base));

    return this;
  }

};

module.exports = Bootstrap;
