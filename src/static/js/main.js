/* globals angular, fn */

angular.module('cssquality', []).controller('cssController', function ($scope) {
  $scope.cssFiles = [];
  $scope.cssFilesSize = 0;
  $scope.hasRun = 0;

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
            css = url + '/' + css;
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
        $scope.processCssFile(data.contents, filename, css, data.status.content_length);
      });
    });
  };

  $scope.processCssFile = function(css, filename, url, filesize) {
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

    thisFile.noLines = Math.max(1, (css.match(/\n/g) || []).length); // FIXME this isn't working

    var classes = fn.getCssDeclarations(minifiedCss);
    thisFile.debug = classes.join('<br/>');
    thisFile.noClassDeclarations = classes.length;

    var longest = fn.longestDeclaration(classes);
    thisFile.longestDeclaration = longest;
    thisFile.longestClasses = [];

    for (var x = 0; x < classes.length; x++) {
      if (classes[x].split(' ').length >= longest) {
        thisFile.longestClasses.push(classes[x]);
      }
    }

    /* warnings */
    thisFile.warnings = [];

    if (!fn.cssIsMinified(css)) {
      var warningMin = {};
      warningMin.title = 'CSS does not appear to be minified';
      warningMin.explain = 'File size could be significantly reduced';
      thisFile.warnings.push(warningMin);
    }

    var ids = fn.findIdUsage(classes);
    var idsLength = ids.length;

    if (idsLength) {
      var warningId = {};
      warningId.title = 'Found ' + idsLength + ' declarations using an ID attribute';
      warningId.details = ids;
      warningId.explain = 'breaks inheritance tree';
      thisFile.warnings.push(warningId);
    }

    /* final output */
    $scope.cssFiles.push(thisFile);
  };
});
