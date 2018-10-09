var fn = {
  debugoutput: '',

  checkBrowserCompatibility: function() {
    // Check for the various File API support. FIXME won't need to check for all of these?
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      return true;
    }
  },

  findDomainFromUrl: function(url) {
    var index = url.search(/[^\/]\/{1}[^\/]/g);
    if (index !== -1) {
      url = url.substring(0, index + 2);
    }
    return url;
  },

  // remove any superfluous url from the URL e.g. trim off /index.php
  handleFileSelect: function(e) {
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

  // should return an array of e.g. '.class{style:value}'
  splitCssByLines: function(css) {
    css = css.replace(/\}/g, '\}#\}');
    var lines = css.split('#}');
    lines = lines.filter(function(n){ return n !== ''; }); // remove empty elements
    return lines;
  },

  // returns an array of all declarations e.g. ['.class', '.class2 ol']
  getCssDeclarations: function(css) {
    var lines = css.replace(/\{([\s\S]*?)\}/g,','); //replace { .. } with comma
    lines = lines.split(','); //then split on commas, also will include comma separated declarations
    return lines;
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
  },

  // returns all class declarations that include an ID
  findIdUsage: function(classes) {
    var matches = [];
    for (var x = 0; x < classes.length; x++) {
      if (classes[x].match(/#[a-zA-Z]/g)) {
        matches.push(classes[x]);
      }
    }
    return matches;
  }
};
