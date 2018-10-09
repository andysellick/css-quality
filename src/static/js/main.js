/* globals angular */

angular.module('cssquality', []).controller('cssController', function ($scope) {
  $scope.cssFiles = [];
  $scope.cssFilesSize = 0;
  $scope.hasRun = 0;
  $scope.showLimit = 5;

  $scope.init = function() {
  };

  $scope.submitForm = function() {
    console.log('form submit');
    $scope.cssFiles = [];
    var url = document.getElementById('website-url').value;

    if (url.length) {
      // depends upon http://multiverso.me/AllOrigins/ to avoid CORS problems
      $.getJSON('http://allorigins.me/get?url=' + encodeURIComponent(url) + '&callback=?', function(data){
        var matches = data.contents.match(/href=[\S]+\.css/g);
        var matchesLength = matches.length;
        for (var x = 0; x < matchesLength; x++) {
          var css = matches[x].replace(/href="/, '');
          //append the URL if the CSS ref is relative
          if (css.substring(0, 4) !== 'http') {
            url = fn.findDomainFromUrl(url);
            css = url + css;
          }
          $scope.downloadCss(css);
        }
      });
    }
  };

  $scope.downloadCss = function(css) {
    $.getJSON('http://allorigins.me/get?url=' + encodeURIComponent(css) + '&callback=?', function(data) {
      var filename = data.status.url.split('/');
      filename = filename[filename.length - 1];
      $scope.$apply(function () {
        $scope.processCssFile(data.contents, filename, css, data.status.content_length, data.status.content_type);
      });
    });
  };

  $scope.processCssFile = function(css, filename, url, filesize, filetype) {
    var thisFile = {};
    $scope.hasRun = 1;

    thisFile.rawCss = css;

    /* clean up */
    css = fn.removeCssComments(css);
    css = fn.removeMediaQueries(css);
    var lines = fn.splitCssByLines(css);

    /* information */

    //details = fn.output(details, url);
    thisFile.title = filename;
    thisFile.url = url;

    var minifiedCss = fn.minifyCss(css); //regardless of whether the CSS appears to be minified, minify it
    // should we check CSS is valid as well?

    var kib = Math.round((filesize / 1024) * 100) / 100;
    $scope.cssFilesSize += kib;
    //$('#totalfilesize').html(parseFloat($('#totalfilesize').html()) + kib);

    //details = fn.output(details, kib + ' KiB');
    //details = fn.output(details, filetype);
    thisFile.fileType = filetype;
    //details = fn.output(details, Math.max(1, (css.match(/\n/g) || []).length) + ' lines long');
    thisFile.noLines = Math.max(1, (css.match(/\n/g) || []).length);

    var classes = fn.getCssDeclarations(minifiedCss);
    //fn.debugoutput = classes.join('<br/>');
    //details = fn.output(details, classes.length + ' class declarations');
    thisFile.debug = classes.join('<br/>');
    thisFile.noClassDeclarations = classes.length;

    var longest = fn.longestDeclaration(classes);
    //details = fn.output(details, 'Longest class declaration is ' + longest + ':');
    thisFile.longestDeclaration = longest;
    //thisFile.classes = '';
    thisFile.longestClasses = [];

    for (var x = 0; x < classes.length; x++) {
      if (classes[x].split(' ').length >= longest) {
        //details = fn.output(details, classes[x]);
        thisFile.longestClasses.push(classes[x]);
      }
    }

    /* warnings */
    thisFile.warnings = [];
    var warning = { 'showAll' : false };

    if (!fn.cssIsMinified(css)) {
      var warningMin = warning;
      warningMin.title = 'CSS does not appear to be minified';
      thisFile.warnings.push(warningMin);
    }

    var ids = fn.findIdUsage(classes);
    var idsLength = ids.length;

    if (idsLength) {
      var warningId = warning;
      warningId.title = 'Found ' + idsLength + ' declarations using an ID attribute';
      warningId.details = ids.slice(0, $scope.showLimit);
      warningId.detailsFull = ids.slice($scope.showLimit);
      thisFile.warnings.push(warningId);
    }

    console.log(thisFile.warnings);

    /* final output */
    //debug = fn.output(debug, fn.debugoutput);
    //raw = fn.output(raw, css);

    //var title = filename;
    //if (warnings) {
    //  title = title + '<br/>Found ' + warnings + ' warnings';
    //}

    //$('#output').append(fn.createToggle(title, details.add(debug).add(raw)));
    //console.log(thisFile);
    $scope.cssFiles.push(thisFile);
  };
});
