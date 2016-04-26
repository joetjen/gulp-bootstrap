# gulp-tasks-bootstrap

A simple gulp task loader.

## Install

```sh
npm install --save-dev gulp-tasks-bootstrap
```

## Usage

Place your tasks in a separate directory, each task is it's own file.
Then, in your `gulpfile.js` require `gulp-bootstrap` and load your tasks
by calling `loadTasks`.

```js
// ./gulpfile.js
'use strict';

require('gulp-bootstrap')
  .loadTasks('gulp/tasks/**/*.js');
```

To make a globaly configuration available to all tasks simple use the
`config` function before loading the tasks. What you do with the
configuration inside the tasks is entirely up to you.

```js
// ./gulpfile.js
'use strict';

require('gulp-bootstrap')
  .config({sources: 'dir/to/sources'})
  .loadTasks('gulp/tasks/**/*.js');
```

## Task definitions

Task definitions must have either a task function or dependencies to be
valid. It's also possible for a task to have a task function *and*
dependencies.

Forcing a task name is purely optional and not advised unless absolutely
necessary.

### Task names
Tasks are named based on their path relative to the task base directory.
For example, let's assume your tasks files are placed within
`./gulp/tasks`. A file named placed at `./gulp/tasks/task1.js` will have
a default name of `task1` while a file placed at
`./gulp/tasks/do/something.js` will have a default name of
`do:something`. You can also use a function as the `name` property which
gets called to generate the name. Inside the function the config is
available with `this.config`.

Additionally task names can be forced by exporting a `name` property in
you task file like:

```js
// file ./gulp/tasks/do/something.js
'use strict';

module.exports.name = 'i-am-doing-something'; // This will force the task name to be 'i-am-doing-something'
module.exports.task = function (next) {
  // do something...

  next();
}
```

or as function

```js
// file ./gulp/tasks/do/something.js
'use strict';

module.exports.name = function () {
  return this.config.prefix + 'i-am-doing-something';
}

module.exports.task = function (next) {
  // do something...

  next();
}
```

### Task functions

The task function to be executed can be either exported directly or as
`task` property. A `task` property takes precedence over a directly
exported function. Inside the function the config is available with
`this.config`.

```js
// file ./gulp/tasks/do/something.js
'use strict';

module.exports.task = function (next) {
  // do something...

  next();
}
```

or as simple export

```js
// file ./gulp/tasks/do/something.js
'use strict';

module.exports = function (next) {
  // do something...

  next();
}
```

### Task dependencies

Task dependencies can be exported as `dependencies` property. They
dependencies must be either a string (i.e. only one dependency exists)
or as array of strings. The `dependencies` property can also be a
function which must return either an array or string. Inside the
function the config is available with `this.config`. Note that
`dependencies` are run by `run-sequence`, therefore they are run
sequentially.

```js
// file ./gulp/tasks/do/something.js
'use strict';

module.exports.dependencies = ['do:something-before'];
```

or more simplier

```js
// file ./gulp/tasks/do/something.js
'use strict';

module.exports.dependencies = 'do:something-before';
```

or as function

```js
// file ./gulp/tasks/do/something.js
'use strict';

module.exports.dependencies = function () {
  return 'do:something-before';
};
```

### Task configuration

Tasks will receive a `config` property which is the config set as
bootstrap config. If you export a `config` property without your task
definition is it either used as default (and thus getting overriden by
the global config) in case you exported an object or, if you exported a
function, the function gets called with the global config as paramenter.

```js
// file ./gulp/tasks/do/something.js
'use strict';

module.exports.config = {
  source: 'default/path/to/sources'
};

module.exports.task = function (next) {

  console.log('my sources are at', this.config.sources);

  // do something...

  next();
};
```

or as function

```js
// file ./gulp/tasks/do/something.js
'use strict';

module.exports.config = function (config) {

  // you can modify the config here.

  return config;
};

module.exports.task = function (next) {

  console.log('my sources are at', this.config.sources);

  // do something...

  next();
};
```

## Empty tasks

By default `gulp-tasks-bootstrap` will throw an error when a task file
contains neither a `task` nor a `dependencies` property. If you want to
allow, but ignore, such files instead you can use the `ignoreEmpty()`
function like:

```js
// ./gulpfile.js
'use strict';

require('gulp-bootstrap')
  .ignoreEmpty(true)
  .loadTasks('gulp/tasks/**/*.js');
```

## LICENSE

Copyright (c) 2015 Jan Oetjen <oetjenj@gmail.com>



Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:



The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.



THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
