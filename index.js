'use strict'

let prequire = require('parent-require')
let glob = require('glob-all')
let path = require('path')
let _ = require('lodash')
let gulp = require('gulp-help')(prequire('gulp'), {
  hideEmpty: true
})
let runSequence = require('run-sequence').use(gulp)

let conf = {}
let ignoreEmpty = false

module.exports = {
  /**
   * Set the configuration for tasks.
   *
   * @param cfg
   */
  config: function (cfg) {
    config.call(this, cfg)

    return this
  },

  /**
   * Allow empty tasks.
   *
   * @param ignore
   */
  ignoreEmpty: function (ignore) {
    ignoreEmpty = ignore

    return this
  },

  /**
   * Load tasks from paths.
   *
   * @param paths
   */
  loadTasks: function (paths) {
    loadTasks.call(this, paths)

    return this
  }
}

function config (cfg) {
  conf = _.merge({}, conf, cfg)
}

function loadTasks (paths) {
  if (!_.isArray(paths)) {
    paths = [paths]
  }

  let files = glob.sync(paths).sort()
  let base = _.reduce(files, findBase)

  if (files.length === 1) base = path.dirname(base)

  files.forEach(loadTask(base))
}

function findBase (a, b) {
  return (function f (a, b, l) {
    if (a === b) {
      return a
    }

    l = l ? l - 1 : (a.length > b.length ? b.length : a.length)

    return f(a.substr(0, l), b.substr(0, l), l)
  })(a, b)
}

function loadTask (base) {
  return function (file) {
    let r = path.relative(base, file)
    let f = path.join(process.cwd(), file)
    let b = path.basename(r)
    let d = path.dirname(r)
    let e = path.extname(b)
    let x = require(f)
    let t = {}
    let c = {}

    if (x['config']) {
      if (_.isFunction(x['config'])) {
        c = x['config'](_.cloneDeep(conf))
      } else {
        c = _.merge({}, conf, x['config'])
      }
    } else {
      c = _.merge({}, conf)
    }

    if (x['name']) {
      if (_.isFunction(x['name'])) {
        t['name'] = (function (fn) {
          let r
          this.config = c
          r = fn.call(this)
          c = this.config

          return r
        })(x['name'])
      } else {
        t['name'] = x['name']
      }
    } else {
      t['name'] = (d === '.' ? '' : d.replace(path.sep, ':') + ':') + path.basename(b, e)
    }

    t = getProperty('dependencies', x, t, c)
    t = getProperty('help', x, t, c)
    t = getProperty('aliases', x, t, c)
    t = getProperty('options', x, t, c)

    if (t['dependencies'] && !_.isArray(t['dependencies'])) {
      t['dependencies'] = [t['dependencies']]
    }

    if (_.isFunction(x['task'])) {
      t['task'] = taskFunc(x['task'], c)
    } else if (_.isFunction(x)) {
      t['task'] = taskFunc(x, c)
    } else {
      if (t['dependencies']) {
        let deps = t['dependencies']

        t['dependencies'] = []
        t['task'] = function (next) {
          runSequence.apply(runSequence, deps.concat(next))
        }
      }
    }

    createTask(t)
  }
}

function taskFunc (fn, c) {
  if (fn.length === 1) {
    return function (next) {
      fn.config = c
      fn.call(fn, next)
    }
  } else {
    return function (next) {
      fn.config = c
      fn.call(fn)
      next.call(next)
    }
  }
}

function getProperty (prop, x, t, c) {
  if (x[prop]) {
    if (_.isFunction(x[prop])) {
      t[prop] = x[prop].call({config: c})
    } else {
      t[prop] = x[prop]
    }
  }

  return t
}

function createTask (task) {
  if (!task['dependencies'] && !task['task']) {
    if (ignoreEmpty) {
      return
    }

    throw new Error('Tasks must either have dependencies or a task function!')
  }

  let opts = {}

  if (task['aliases']) opts['aliases'] = task['aliases']
  if (task['options']) opts['options'] = task['options']

  let args = [
    task['name'],
    task['help'],
    task['dependencies'],
    task['task'],
    opts
  ]

  gulp.task.apply(gulp, args)
}
