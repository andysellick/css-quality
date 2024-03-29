Unfinished
==========

Making this work (notes to self)
--------------------------------

Because this is all so old and dependencies have shifted massively since it was first started, you might need to do a few things to make it work. At this point I'm pretty close to abandoning the whole task runner premise and just minifying by hand, but it does include the test runner so it is a bit needed, at least.

You need to have the gulp cli globally installed (`npm install --global gulp-cli`)

- `gulp` to get the server up and running
- (or `npm run run-gulp` if you've not got gulp cli installed)
- Jasmine tests are included, run `gulp jasmine`, visit localhost:8888

For reference, using versions:

- node 14.17.6
- npm 6.14.15

If you get an error about `os.tmpDir` try modifying `node_modes/cache-swap/index.js` as shown. Note that this will need to be changed again after every npm install (see https://github.com/alhazmy13/serverless-offline-python/issues/18)

```
var os = require('os');
os.tmpDir = os.tmpdir;
var tmpDir = require('os').tmpDir();
```

Use of Gulp
------------

There is a `gulpfile.js` within this repository to make development much quicker for the house styles. All you need to do is:
* Install Node (http://nodejs.org) & Gulp (https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md)
* Run `npm run setup`
This will install all the dependencies found in `package.json` (The `node_modules` folder that is generated when you run this command should be created on a case-by-case basis and not pushed to a repository), install the Bower dependencies found in `package.json` and run the local server through the `gulp` command.

Note for Windows users with Git Bash: you may need to run 'npm run setup' a couple of times for it to finally work.

This will open up a tab in your browser, running a server at `localhost:3000` (unless you have set up a proxy server address - details on how to change this are in the `gulpfile.js` file).

Gulp features
-------------

Name | Version | Description
--- | --- | ---
**gulp** | ^3.9.0 | Task runner to automate various tasks
**browser-sync** | ^2.8.0 | Local server enabling instant DOM injection to all devices connected when a file is changed
**gulp-bytediff** | ^1.0.0 | Shows a the difference between file sizes before and after gulp tasks have run.
**gulp-concat** | ^2.6.0 | Concatenates multiple files into one
**gulp-cache** | ^0.2.10 | Enables caching of piped files to prevent tasks being run unnecessarily
**gulp-imagemin** | ^2.3.0 | Compresses images - packaged with gifsicle, jpegtran, optipng, and svgo
**gulp-jshint** | ^1.11.2 | Provides JS validation and hinting. Settings for this are in the `.jshintrc` file
**gulp-less** | ^3.0.3 | Converts LESS files in CSS
**gulp-load-plugins** | ^1.0.0-rc.1 | Handles the `require()` functions for all plugins in `package.json`
**gulp-minify-css** | ^1.2.0 | Minifies CSS files to reduce file sizes
**gulp-newer** | ^0.5.1 | Ensure that gulp tasks only run on files that have changed rather than all files.
**gulp-notify** | ^2.2.0 | Enables the use of native notifications to display when tasks are complete
**gulp-plumber** | ^1.0.1 | Prevent pipe breaking caused by errors from gulp plugins
**gulp-rename** | ^1.2.2 | Allows files to be renamed via JS
**gulp-uglify** | ^1.2.0 | Minifies JS files
**gulp-util** | ^3.0.6 | Utility functions for gulp plugins
**jshint-stylish** | ^2.0.1 | Stylish reporter for JSHint
**path** | ^0.11.14 | Copy of Node.JS path module
**del** | ^1.2.0 | Enables the deleting of files

### BrowserSync

The main component of this Gulp setup is BrowserSync. This plugin provides the following advantages for development:
* Simultaneous page scrolling for all devices connected to the same link
* Clicking links or populating form fields on one device will duplicate this behaviour on all other linked devices
* A dashboard at `localhost:3001` where you can send commands to all connected devices, perform actions and do network throttle testing.
