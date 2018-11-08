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
    var minifiedCss = fn.minifyCss(css); //regardless of whether the CSS appears to be minified, minify it
    // should we check CSS is valid as well?

    /* information */

    //details = fn.output(details, url);
    thisFile.title = filename;
    thisFile.url = url;

    //var cssArray = fn.convertMinifiedCssToArray(minifiedCss);
    //console.log(fn.convertCssToObject(cssArray));

    var kib = Math.round((filesize / 1024) * 100) / 100;
    thisFile.fileSize = kib;
    $scope.cssFilesSize += kib;

    thisFile.noLines = Math.max(1, (css.match(/\n/g) || []).length); // FIXME this isn't working

    var classes = fn.getCssDeclarations(minifiedCss);
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

    var warningId = {};
    warningId.title = 'Found declarations using an ID attribute';
    warningId.explain = 'breaks inheritance tree';
    warningId.details = [];

    var warningImportant = {};
    warningImportant.title = 'Found properties using !important';
    warningImportant.explain = 'breaks inheritance tree';
    warningImportant.details = [];

    var warnDeclarations = [warningId];
    var warnDeclarationsFunctions = [fn.findIdUsageInDeclarations];
    var warnProperties = [warningImportant];
    var warnPropertiesFunctions = [fn.findImportantUsageInProperties];

    var cssObjArray = fn.convertCssToObject(fn.convertMinifiedCssToArray(minifiedCss));

    // loop through all the declarations
    for(var c = 0; c < cssObjArray.length; c++) {
      var declaration = cssObjArray[c].selector;
      var properties = cssObjArray[c].properties;
      var line = cssObjArray[c].line;

      // test each declaration for warnings
      for (var d = 0; d < warnDeclarationsFunctions.length; d++) {
        var dresult = warnDeclarationsFunctions[d](declaration);
        if (dresult) {
          warnDeclarations[d].details.push(dresult);
        }
      }

      // test each property for warnings
      for (var p = 0; p < warnPropertiesFunctions.length; p++) {
        for (var i = 0; i < properties.length; i++) {
          var presult = warnPropertiesFunctions[p](properties[i]);
          if (presult) {
            warnProperties[p].details.push(presult);
          }
        }
      }
    }

    // if warnings have been added to warning objects, add to output warnings
    for (var w = 0; w < warnDeclarations.length; w++) {
      if (warnDeclarations[w].details.length) {
        thisFile.warnings.push(warnDeclarations[w]);
      }
    }

    for (var w = 0; w < warnProperties.length; w++) {
      if (warnProperties[w].details.length) {
        thisFile.warnings.push(warnProperties[w]);
      }
    }

    /* final output */
    $scope.cssFiles.push(thisFile);
  };
});
