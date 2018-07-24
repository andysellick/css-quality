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
            console.log(matches[x].replace(/href="/, ''));
            var css = url + matches[x].replace(/href="/, '');

            $.getJSON('http://allorigins.me/get?url=' + encodeURIComponent(css) + '&callback=?', function(data){
              app.processCSSFile(data.contents);
            });
          }
        });
      }
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
      app.processCSSFile(e.target.result, file);
    };

    reader.onerror = function (e) {
      document.getElementById('results').innerHTML = 'error reading file';
    };
  },

  processCSSFile: function(css, file) {
    var output = '';
    var minifiedCss = '';

    css = app.removeCSSComments(css);

    if (!app.cssIsMinified(css)) {
      minifiedCss = app.minifyCss(css);
      output += 'CSS is not minified';
    }
    else {
      minifiedCss = css;
      output += 'CSS is minified';
    }

    // should we check CSS is valid as well?

    //output += '\n\n' + file.name;
    //output += '\n\t' + (file.size / 1024) + ' KiB';
    //output += '\n\t' + file.type;
    //output += '\n\tLast modified ' + file.lastModifiedDate;
    output += '\n\t' + (css.match(/\n/g) || []).length + ' lines long';

    var classes = app.countCssDeclarations(minifiedCss);
    output += '\n\n' + classes.length + ' class declarations';

    var longest = app.longestDeclaration(classes);
    output += '\n\nLongest CSS nest is ' + longest + ' classes:';
    for (var x = 0; x < classes.length; x++) {
      if (classes[x].split(' ').length >= longest) {
        output += '\n\t' + classes[x];
      }
    }

    var detailsOutput = $('<output/>').addClass('output results').html(output);
    var debugOutput = $('<output/>').addClass('output debug').html(app.debugoutput);
    var cssOutput = $('<output/>').addClass('output').html(minifiedCss);

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
