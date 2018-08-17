var app = window.app || {};

app = {
  debugoutput: '',

  init: function() {
    'use strict';

    app.createToggleEvents();

    if (this.checkBrowserCompatibility()) {
      var fileinput = document.getElementById('file');
      if (fileinput) {
        fileinput.addEventListener('change', app.handleFileSelect, false);
      }
    }

    var websiteform = document.getElementById('website-form');

    if (websiteform) {
      websiteform.addEventListener('submit', function(e) {
        e.preventDefault();
        var url = document.getElementById('website-url').value;

        if (url.length) {
          // depends upon http://multiverso.me/AllOrigins/ to avoid CORS problems
          $.getJSON('http://allorigins.me/get?url=' + encodeURIComponent(url) + '&callback=?', function(data){
            var matches = data.contents.match(/href=[\S]+\.css/g);
            var matchesLength = matches.length;
            for (var x = 0; x < matchesLength; x++) {
              var css = matches[x].replace(/href="/, '');
              //append the URL if the CSS ref is relative
              if (css.indexOf('http') === -1) {
                css = url + css;
              }
              app.downloadCss(css);
            }

            var $overview = $('#overview');
            $overview.html('Found ' + matchesLength + ' CSS files totalling <span id="totalfilesize">0</span> KiB. Some of these files may not be included in page load (why not?).');
            $('<a/>').addClass('overview__toggle js-show-all').html('Show all').attr('data-toggle', 'closed').appendTo($overview);
          });
        }
      });
    }
  },

  downloadCss: function(css) {
    $.getJSON('http://allorigins.me/get?url=' + encodeURIComponent(css) + '&callback=?', function(data) {
      var filename = data.status.url.split('/');
      filename = filename[filename.length - 1];
      app.processCssFile(data.contents, filename, css, data.status.content_length, data.status.content_type);
    });
  },

  checkBrowserCompatibility: function() {
    // Check for the various File API support. FIXME won't need to check for all of these?
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      return true;
    }
  },

  handleFileSelect: function(e) {
    var reader = new FileReader();
    var files = e.target.files;
    var file = files[0];
    reader.readAsText(file, 'UTF-8');

    reader.onload = function (e) {
      app.processCssFile(e.target.result, file.name, file.size, file.type);
    };

    reader.onerror = function (e) {
      document.getElementById('results').innerHTML = 'error reading file';
    };
  },

  processCssFile: function(css, filename, url, filesize, filetype) {
    //var output = '';
    var minifiedCss = '';
    css = app.removeCssComments(css);
    css = app.removeMediaQueries(css);
    var details = $('<div/>').addClass('output results').html('<h3>Results</h3>');
    var debug = $('<div/>').addClass('output debug').html('<h3>Debug</h3>');
    var raw = $('<div/>').addClass('output raw').html('<h3>Raw</h3>');

    details = app.output(details, url);

    if (app.cssIsMinified(css)) {
      details = app.output(details, 'CSS appears to be minified');
    }
    else {
      details = app.output(details, 'CSS does not appear to be minified');
    }

    minifiedCss = app.minifyCss(css); //regardless of whether the CSS appears to be minified, minify it
    // should we check CSS is valid as well?

    var kib = Math.round((filesize / 1024) * 100) / 100;

    $('#totalfilesize').html(parseFloat($('#totalfilesize').html()) + kib);

    details = app.output(details, kib + ' KiB');
    details = app.output(details, filetype);
    details = app.output(details, Math.max(1, (css.match(/\n/g) || []).length) + ' lines long');

    var classes = app.getCssDeclarations(minifiedCss);
    details = app.output(details, classes.length + ' class declarations');

    var longest = app.longestDeclaration(classes);
    details = app.output(details, 'Deepest CSS nest is ' + longest + ' declarations:');
    for (var x = 0; x < classes.length; x++) {
      if (classes[x].split(' ').length >= longest) {
        details = app.output(details, classes[x]);
      }
    }

    debug = app.output(debug, app.debugoutput);

    //var cssOutput = $('<section/>').addClass('output raw').html(minifiedCss);
    //var cssOutput = $('<section/>').addClass('output raw').html('<h3>Original CSS</h3>' + css); //should we output the original CSS here or our minified version?
    raw = app.output(raw, css);

    $('#output').append(app.createToggle(filename, details.add(debug).add(raw)));
  },

  // given a wrapper element, append content into it
  output: function(wrapper, content, el, className) {
    if (el) {
      content = $(el).addClass(className).html(content);
    }
    else {
      content = content + '\n';
    }
    wrapper.html(wrapper.html() + content);
    return wrapper;
  },

  createToggle: function(title, content) {
    var $wrapper = $('<section/>').addClass('details js-toggle');
    var $header = $('<div/>').addClass('details__header js-toggle-link').html(title);
    var $content = $('<div/>').addClass('details__content js-toggle-content').html(content).hide();
    $wrapper.append($header, $content);
    return $wrapper;
  },

  createToggleEvents: function() {
    $('#overview').on('click', '.js-show-all', function(e) {
      e.preventDefault();
      if ($(this).attr('data-toggle') === 'closed') {
        $('.js-toggle-content').show();
        $(this).attr('data-toggle', 'open').text('Hide all');
      }
      else {
        $('.js-toggle-content').hide();
        $(this).attr('data-toggle', 'closed').text('Show all');
      }
    });

    $('#output').on('click', '.js-toggle-link', function() {
      $(this).closest('.js-toggle').find('.js-toggle-content').toggle();
    });
  },

  cssIsMinified: function(css) {
    if ((css.match(/\n/g) || []).length > 1 || (css.match(/\t/g) || []).length > 0) {
      return false;
    } else {
      return true;
    }
  },

  removeCssComments: function(css) {
    css = css.replace(/[^\:\;]+\/\/[\s\S]+?\n+/g, '\n'); // remove // comments, but not strings like http://
    return css.replace(/\/\*[\s\S]*\*\//g, ''); // remove /* comments */
  },

  removeMediaQueries: function(css) {
    // remove any lines starting @ (something){ but not @font or @-ms-
    css = css.replace(/@{1}(?!font)(?!-ms)[\s\S][^\{]*\{/g, '');
    // remove any double }} (end of media query), only instance of a double }}? FIXME check
    return css.replace(/\}[\t\n]*\}/g, '}');
  },

  // note that this doesn't properly minify the CSS - only as far as we need to for analysing it
  minifyCss: function(css) {
    css = css.trim();
    css = css.replace(/\n/g, ''); //remove newlines
    css = css.replace(/\t/g, ''); //remove tabs
    css = css.replace(/\s\s+/g, ' '); //replace multiple spaces with a single space
    css = css.replace(/;\s*\}\s*/g, '}'); //remove any semi colons immediately followed by a close curly brace

    // remove whitespace around the following characters
    var chars = ['{', '}', ',', ':', ';', '"', '>', '~'];
    for (var x = 0; x < chars.length; x++) {
      var re = new RegExp('\\s*' + '\\' + chars[x] + '\\s*', 'g');
      css = css.replace(re, chars[x]);
    }
    // special cases
    css = css.replace(/\s*\+\s*/g, '+'); //remove whitespace around + selector
    css = css.replace(/\s*\'\s*/g, '\''); //remove whitespace around '

    return css;
  },

  getCssDeclarations: function(css) {
    var lines = css.replace(/\{([\s\S]*?)\}/g,','); //replace { .. } with comma
    lines = lines.split(','); //then split on commas, also will include comma separated declarations
    //lines = app.removeMediaQueryLines(lines);
    app.debugoutput = lines.join('<br/>');
    return lines;
  },

  // expects an array of CSS declarations
  /*
  removeMediaQueryLines: function(lines) {
    var cleanedLines = [];

    var cleaner = function(line) {
      if (line.match(/^\s*\}/)) { //if line begins with } e.g. }.h1 (after a closing media query)
        line = line.replace(/^\s*\}/, ''); //remove the } and return the line
      }
      if (!line.match(/^@media/)) {
        return line;
      }
    };

    for (var x = 0; x < lines.length; x++) {
      var result = cleaner(lines[x]);
      if (result) {
        cleanedLines.push(result.trim());
      }
    }
    return cleanedLines;
  },
  */

  longestDeclaration: function(lines) {
    var longest = 0;
    var longestCSS = [];

    for (var x = 0; x < lines.length; x++) {
      var length = lines[x].split(' ').length;
      if (length > longest) {
        longest = length;
      }
    }
    return longest;
  }
};

$(document).ready(function() {
  app.init();
});
