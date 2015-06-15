# gulp-bootstrap

A simple gulp task loader.

## Install

```sh
npm install --save-dev gulp-bootstrap
```

## Usage

Place your tasks in a separate directory, each task is it's own file. Then, in your `gulpfile.js` require `bootstrap`
and load your tasks by calling `loadTasks`.

```js
// gulpfile.js
'use strict';

require('gulp-bootstrap')
  .loadTasks('gulp/tasks/**/*.js');
```

## Task definitions

Task files can either export a function to be used as
