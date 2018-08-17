var app = window.app || {};

describe("CSS Quality Checker", function() {
  it('correctly identifies minified CSS as minified', function() {
    var output = app.cssIsMinified('.moo{background-color:"red";');

    expect(output).toBe(true);
  });

  it('correctly identifies unminified CSS as unminified', function() {
    var css = `
      .moo {
        background-color: "red";
      }
    `;
    var output = app.cssIsMinified(css);

    expect(output).toBe(false);
  });

  it('removes CSS comments', function() {
    var css = `
/* this is a comment*/
/* this is a comment
over several lines */
.moo,
a[href^="http://"]:after {
  color: "red";// this is a comment
// this is another comment
}`;
    var output = app.removeCssComments(css);
    var expected = `

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
    var output = app.minifyCss(css);
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
    var output = app.removeMediaQueries(css);
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

  it('creates a toggle section correctly', function() {
    var toggle = app.createToggle('My title', 'My content');
    var expected = $('<section class="details js-toggle"><div class="details__header js-toggle-link">My title</div><div class="details__content js-toggle-content" style="display: none;">My content</div></section>');

    expect(toggle).toEqual(expected);
  });
});
