var fn = {
  checkBrowserCompatibility: function () {
    // Check for the various File API support. FIXME won't need to check for all of these?
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      return true;
    }
  },

  // get the URL as the string up to the first instance of '/'
  findDomainFromUrl: function (url) {
    var index = url.search(/[^\/]\/{1}[^\/]/g);
    if (index !== -1) {
      url = url.substring(0, index + 1);
    }
    return url;
  },

  // remove any superfluous url from the URL e.g. trim off /index.php
  handleFileSelect: function (e) {
    var reader = new FileReader();
    var files = e.target.files;
    var file = files[0];
    reader.readAsText(file, 'UTF-8');

    reader.onload = function (e) {
      fn.processCssFile(e.target.result, file.name, file.size, file.type);
    };

    reader.onerror = function (e) {
      document.getElementById('results').innerHTML = 'error reading file';
    };
  },

  cssIsMinified: function (css) {
    if ((css.match(/\n/g) || []).length > 1 || (css.match(/\t/g) || []).length > 0) {
      return false;
    } else {
      return true;
    }
  },

  removeCssComments: function (css) {
    css = css.replace(/[^\:\;]+\/\/[\s\S]+?\n+/g, '\n'); // remove // comments, but not strings like http://
    return css.replace(/\/\*[\s\S]*?\*\//g, ''); // remove /* comments */
  },

  removeMediaQueries: function (css) {
    // remove any lines starting @ (something){ but not @font or @-ms-
    css = css.replace(/@{1}(?!font)(?!-ms)[\s\S][^\{]*\{/g, '');
    // remove any double }} (end of media query), only instance of a double }}? FIXME check
    return css.replace(/\}[\t\n]*\}/g, '}');
  },

  // note that this doesn't properly minify the CSS - only as far as we need to for analysing it
  minifyCss: function (css) {
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

  // should return an array of e.g. '.class{style:value}'
  splitCssByLines: function (css) {
    css = css.replace(/\}/g, '\}#\}');
    var lines = css.split('#}');
    lines = lines.filter(function(n){ return n !== ''; }); // remove empty elements
    return lines;
  },

  // returns an array of all declarations e.g. ['.class', '.class2 ol']
  getCssDeclarations: function (css) {
    var lines = css.replace(/\{([\s\S]*?)\}/g,','); //replace { .. } with comma
    lines = lines.split(','); //then split on commas, also will include comma separated declarations
    lines = lines.filter(function (el) {
      return el !== '';
    });
    return lines;
  },

  // given a chunk of minified CSS, turn it into an array of each line
  convertMinifiedCssToArray: function (css) {
    var uniqueChar = 'MOOOOOOO';
    css = css.replace(/{/g, '{' + uniqueChar);
    css = css.replace(/;/g, ';' + uniqueChar);
    css = css.replace(/}/g, uniqueChar + '}' + uniqueChar);
    css = css.split(uniqueChar);
    return css.slice(0, -1);
  },

  // converts an array of CSS lines into a structured object of the CSS, of the form
  // assumes all selectors are on one line, even if comma separated
  /*
    [
      {
        'selector': '.element .thing',
        'line': 1,
        'properties': [
          'border: solid 1px red;',
          'background: green !important'
        ]
      }
    ]
  */
  convertCssToObject: function (css) {
    var output = [];
    var line = 1;
    for (var x = 0; x < css.length; x++) {
      var thisobj = {};
      // if this is a selector, i.e. ends with {
      if (css[x].slice(-1) === '{') {
        thisobj.selector = css[x].replace('{', '').trim(); // fixme trim off the { ?
        thisobj.line = line;
        line += thisobj.selector.split(",").length || 1; // increment the line number assuming selectors are on different lines
        //line++;
        x++;
        var properties = [];

        // while the next line is not the end of the selector, i.e. }
        while(css[x] !== '}') {
          properties.push(css[x]);
          line++;
          x++;
        }
        thisobj.properties = properties;
        output.push(thisobj);
        line++;
      }
    }
    return output;
  },

  longestDeclaration: function (lines) {
    var longest = 0;
    var longestCSS = [];

    for (var x = 0; x < lines.length; x++) {
      var length = lines[x].split(' ').length;
      if (length > longest) {
        longest = length;
      }
    }
    return longest;
  },

  // returns all class declarations that include an ID
  // FIXME redundant
  findIdUsage: function (classes) {
    var matches = [];
    for (var x = 0; x < classes.length; x++) {
      if (classes[x].match(/#[a-zA-Z]/g)) {
        matches.push(classes[x]);
      }
    }
    return matches;
  },

  findIdUsageInDeclarations: function (declaration) {
    if (declaration.match(/#[a-zA-Z]/g)) {
      return declaration;
    } else {
      return false;
    }
  },

  // returns all uses of !important
  // FIXME redundant
  findImportantUsage: function (lines) {
    console.log(lines);
    var matches = [];
    for (var x = 0; x < lines.length; x++) {
      if (lines[x].match) {
        matches.push(lines[x]);
      }
    }
  },

  // looks for !important and ! important
  findImportantUsageInProperties: function (property) {
    if (property.match(/![\s]*important/g)) {
      return property;
    } else {
      return false;
    }
  },

  findQualifiedSelectors: function (declaration) {
    if (declaration.match(/[,]{1}[^.]{1}[\w]+[.]/g) || declaration.match(/^[\w]+[.]/g)) {
      return declaration;
    } else {
      return false;
    }
  }
};
