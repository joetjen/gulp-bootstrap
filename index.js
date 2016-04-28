'use strict'

const glob = require('glob-all')
const path = require('path')
const _ = require('lodash')
const gulp = require('gulp-help')(require('gulp'), {
  hideEmpty: true
})
const runSequence = require('run-sequence').use(gulp)

let _conf = {}
let _ignoreEmpty = false

module.exports = {
  config,
  ignoreEmpty,
  loadTasks
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Set the configuration for tasks.
 *
 * @param cfg
 */
function config (cfg) {
  _config.call(this, cfg)

  return this
}

/**
 * Allow empty tasks.
 *
 * @param ignore
 */
function ignoreEmpty (ignore) {
  _ignoreEmpty = ignore

  return this
}

/**
 * Load tasks from paths.
 *
 * @param paths
 */
function loadTasks (paths) {
  _loadTasks.call(this, paths)

  return this
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function _config (cfg) {
  _conf = _.merge({}, _conf, cfg)
}

function _loadTasks (paths) {
  if (!_.isArray(paths)) {
    paths = [paths]
  }

  let files = glob.sync(paths).sort()
  let base = _.reduce(files, _findBase)

  if (files.length === 1) {
    base = path.dirname(base)
  }

  files.forEach(_loadTask(base))
}

function _findBase (a, b) {
  return (function f (a, b, l) {
    if (a === b) {
      return a
    }

    l = l ? l - 1 : (a.length > b.length ? b.length : a.length)

    return f(a.substr(0, l), b.substr(0, l), l)
  })(a, b)
}

function _loadTask (base) {
  return function (file) {
    let relative = path.relative(base, file)
    let fullpath = path.join(process.cwd(), file)
    let basepath = path.basename(relative)
    let directory = path.dirname(relative)
    let extension = path.extname(basepath)
    let taskFile = require(fullpath)
    let task = {}
    let config = _.merge({}, _conf)

    if (taskFile['config']) {
      if (_.isFunction(taskFile['config'])) {
        config = _.merge(config, taskFile['config'](_.cloneDeep(_conf)))
      } else {
        config = _.merge(config, taskFile['config'])
      }
    }

    if (taskFile['name']) {
      if (_.isFunction(taskFile['name'])) {
        task['name'] = (function (fn) {
          let r

          this.config = config

          r = fn.call(this)

          config = this.config

          return r
        })(taskFile['name'])
      } else {
        task['name'] = taskFile['name']
      }
    } else {
      task['name'] = (directory === '.'
          ? ''
          : directory.replace(path.sep, ':') + ':') + path.basename(basepath, extension)
    }

    task = _getProperty('dependencies', taskFile, task, config)
    task = _getProperty('help', taskFile, task, config)
    task = _getProperty('aliases', taskFile, task, config)
    task = _getProperty('options', taskFile, task, config)

    if (task['dependencies']) {
      task['dependencies'] = _.flatten([task['dependencies']])
    }

    if (_.isFunction(taskFile['task'])) {
      task['task'] = (function (fn) {
        let f = function (next) {
          this.config = config

          return fn.apply(this, arguments)
        }

        if (fn.length === 1) {
          return function (a) {
            return f.apply(this, arguments)
          }
        } else {
          return function () {
            return f.apply(this, arguments)
          }
        }
      })(taskFile['task'])
    } else if (_.isFunction(taskFile)) {
      task['task'] = (function (fn) {
        if (fn.length === 1) {
          return function (next) {
            this.config = config

            return fn.apply(this, arguments)
          }
        } else {
          return function () {
            this.config = config

            return fn.apply(this, arguments)
          }
        }
      })(taskFile)
    } else if (task['dependencies']) {
      let dependencies = task['dependencies']

      delete task['dependencies']

      task['task'] = function (next) {
        runSequence.apply(runSequence, dependencies.concat(next))
      }
    }

    _createTask(task)
  }
}

function _getProperty (prop, source, task, config) {
  if (source[prop]) {
    if (_.isFunction(source[prop])) {
      task[prop] = source[prop].call({config: config})
    } else {
      task[prop] = source[prop]
    }
  }

  return task
}

function _createTask (task) {
  if (!task['dependencies'] && !task['task']) {
    if (_ignoreEmpty) {
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
