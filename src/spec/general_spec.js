describe('CSS Quality Checker', function() {
  it('correctly identifies minified CSS as minified', function() {
    var output = fn.cssIsMinified('.moo{background-color:"red";');

    expect(output).toBe(true);
  });

  it('correctly identifies unminified CSS as unminified', function() {
    var css = `
      .moo {
        background-color: "red";
      }
    `;
    var output = fn.cssIsMinified(css);

    expect(output).toBe(false);
  });

  it('removes CSS comments', function() {
    var css = `
/* this is a comment*/
.classname {}
/* this is a comment
over several lines */
.moo,
a[href^="http://"]:after {
  color: "red";// this is a comment
// this is another comment
}`;
    var output = fn.removeCssComments(css);
    var expected = `

.classname {}

.moo,
a[href^="http://"]:after {
  color: "red";
}`;

    expect(output).toEqual(expected);
  });

  it('minifies CSS correctly', function() {
    var css = `
      .c1 , .c2  ,
      .c1  >  .c2,
      .c1  +  .c2,
      .c1  ~  .c2 {
        color  :   " red   " ;
        color: 'blue' ;
        text-align: center  ;
        font-weight:bold;
      }
    `;
    var output = fn.minifyCss(css);
    var expected = `.c1,.c2,.c1>.c2,.c1+.c2,.c1~.c2{color:"red";color:'blue';text-align:center;font-weight:bold}`;

    expect(output).toEqual(expected);
  });

  it('removes media query lines', function() {
    var css = `
@media only screen and (-webkit-min-device-pixel-ratio: 2),
only screen and (min--moz-device-pixel-ratio: 2),
only screen and (min-resolution: 2dppx){
  #global-header .header-wrapper .header-global .header-logo{
    width:auto;float:none
  }
  @font-face{font-family:'nta';}
  @-ms-viewport {
    width: device-width
  }
}
`;
    var output = fn.removeMediaQueries(css);
    var expected = `

  #global-header .header-wrapper .header-global .header-logo{
    width:auto;float:none
  }
  @font-face{font-family:'nta';}
  @-ms-viewport {
    width: device-width
  }
`;
    expect(output).toEqual(expected);
  });

  it('splits CSS into separate lines', function() {
    var css = 'html{font-size:62.5%}*{color:black;}body{font-family:sans-serif;font-weight:400}';
    var output = fn.splitCssByLines(css);
    var expected = [
      'html{font-size:62.5%}',
      '*{color:black;}',
      'body{font-family:sans-serif;font-weight:400}'
    ];

    expect(output).toEqual(expected);
  });

  it('finds uses of ID in declaration', function() {
    var css = [
      'body',
      '.class',
      '#id',
      'body#id',
      'a[href^="#"]:after'
    ];
    var output = fn.findIdUsage(css);
    var expected = [
      '#id',
      'body#id'
    ];

    expect(output).toEqual(expected);
  });

  it('creates a toggle section correctly', function() {
    var toggle = fn.createToggle('My title', 'My content');
    var expected = $('<section class="details js-toggle"><div class="details__header js-toggle-link">My title</div><div class="details__content js-toggle-content" style="display: none;">My content</div></section>');

    expect(toggle).toEqual(expected);
  });

  it('finds the domain part of URLs', function() {
    var url = fn.findDomainFromUrl('http://www.quantpole.co.uk/index.php');
    var expected = 'http://www.quantpole.co.uk';

    expect(url).toEqual(expected);

    url = fn.findDomainFromUrl('http://www.quantpole.co.uk/browse/index.php');
    expected = 'http://www.quantpole.co.uk';

    expect(url).toEqual(expected);
  });
});
