var app = window.app || {};

app = {
  debugoutput: '',

  init: function() {
    'use strict';

    if (this.checkBrowserCompatibility()) {
      document.getElementById('file').addEventListener('change', app.handleFileSelect, false);
    }

    document.getElementById('website-form').addEventListener('submit', function(e) {
      e.preventDefault();
      var url = document.getElementById('website-url').value;

      if (url.length) {
        // depends upon http://multiverso.me/AllOrigins/ to avoid CORS problems
        $.getJSON('http://allorigins.me/get?url=' + encodeURIComponent(url) + '&callback=?', function(data){
          var matches = data.contents.match(/href=[\S]+\.css/g);
          var matchesLength = matches.length;
          for (var x = 0; x < matchesLength; x++) {
            var css = url + matches[x].replace(/href="/, '');
            app.downloadCss(css);
          }
        });
      }
    });
  },

  downloadCss: function(css) {
    $.getJSON('http://allorigins.me/get?url=' + encodeURIComponent(css) + '&callback=?', function(data) {
      var filename = data.status.url.split('/');
      filename = filename.slice(3).join('/');
      app.processCssFile(data.contents, filename, data.status.content_length, data.status.content_type);
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

  processCssFile: function(css, filename, filesize, filetype) {
    var output = '';
    var minifiedCss = '';
    css = app.removeCSSComments(css);

    if (app.cssIsMinified(css)) {
      output += 'CSS appears to be minified';
    }
    else {
      output += 'CSS does not appear to be minified';
    }
    minifiedCss = app.minifyCss(css); //regardless of whether the CSS appears to be minified, minify it
    // should we check CSS is valid as well?

    output += '\n\n' + filename;
    output += '\n\t' + Math.round((filesize / 1024) * 100) / 100 + ' KiB';
    output += '\n\t' + filetype;
    output += '\n\t' + Math.max(1, (css.match(/\n/g) || []).length) + ' lines long';

    var classes = app.countCssDeclarations(minifiedCss);
    output += '\n\n' + classes.length + ' class declarations';

    var longest = app.longestDeclaration(classes);
    output += '\n\nDeepest CSS nest is ' + longest + ' declarations:';
    for (var x = 0; x < classes.length; x++) {
      if (classes[x].split(' ').length >= longest) {
        output += '\n\t' + classes[x];
      }
    }

    var detailsOutput = $('<section/>').addClass('output results').html("<h3>Results</h3>" + output);
    var debugOutput = $('<section/>').addClass('output debug').html("<h3>Debug</h3>" + app.debugoutput);
    //var cssOutput = $('<section/>').addClass('output raw').html(minifiedCss);
    var cssOutput = $('<section/>').addClass('output raw').html("<h3>Original CSS</h3>" + css); //should we output the original CSS here or our minified version?

    var outputEl = $('#output');
    outputEl.append(detailsOutput, debugOutput, cssOutput);
  },

  cssIsMinified: function(css) {
    if ((css.match(/\n/g) || []).length > 1 || (css.match(/\t/g) || []).length > 0) {
      return false;
    } else {
      return true;
    }
  },

  removeCSSComments: function(css) {
    return css.replace(/\/\*[\s\S]*\*\//g, '');
  },

  minifyCss: function(css) {
    css = css.replace(/\n/g, ''); //remove newlines
    css = css.replace(/\t/g, ''); //remove tabs
    css = css.replace(/\s\s+/g, ' '); //replace multiple spaces with a single space
    css = css.replace(/\s*\{\s*/g, '{'); //remove whitespace around open curly braces
    css = css.replace(/\s*:\s*/g, ':'); //remove whitespace around colons
    css = css.replace(/\s*\"\s*/g, '"'); //remove whitespace around double quote marks
    css = css.replace(/;\s*\}\s*/g, '}'); //remove any semi colons immediately followed by a close curly brace
    css = css.replace(/\s*\+\s*/g, '+'); //remove whitespace around + selector
    css = css.replace(/\s*\>\s*/g, '>'); //remove whitespace around > selector
    css = css.replace(/\s*\~\s*/g, '~'); //remove whitespace around > selector
    return css;
  },

  countCssDeclarations: function(css) {
    var lines = css.replace(/\{([\s\S]*?)\}/g,','); //replace { .. } with comma
    lines = lines.split(','); //then split on commas, also will include comma separated declarations
    lines = app.removeMediaQueryLines(lines);
    app.debugoutput = lines.join('<br/>');
    return lines;
  },

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
