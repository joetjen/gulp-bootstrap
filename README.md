# gulp-bootstrap

A simple gulp task loader.

## Install

```sh
npm install --save-dev gulp-bootstrap
```

## Usage

Place your tasks in a separate directory, each task is it's own file. Then, in your `gulpfile.js` require
`gulp-bootstrap` and load your tasks by calling `loadTasks`.

```js
// ./gulpfile.js
'use strict';

require('gulp-bootstrap')
  .loadTasks('gulp/tasks/**/*.js');
```

## Task definitions

Task definitions must have either a task function or dependencies to be valid. It's also possible for a task to have
a task function *and* dependencies.

Forcing a task name is purely optional and not advised unless absolutely necessary.

### Task names
Tasks are named based on their path relative to the task base directory. For example, let's assume your tasks files
are placed within './gulp/tasks'. A file named placed at './gulp/tasks/task1.js' will have a default name of 'task1'
while a file placed at './gulp/tasks/do/something.js' will have a default name of 'do:something'.

Additionally task names can be forced by exporting a 'name' property in you task file like:

```js
// file ./gulp/tasks/do/something.js
'use strict';

module.exports.name = 'i-am-doing-something'; // This will force the task name to be 'i-am-doing-something'
module.exports.task = function (next) {
  // do something...

  next();
}
```

### Task functions

The task function to be executed can be either exported directly or as 'task' property.

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

Task dependencies can be exported as 'dependencies' property. They dependencies must be either a string (i.e. only
one dependency exists) or as array of strings.

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

## Changelog

### v0.1.0

First release.
