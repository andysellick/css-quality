var app = window.app || {};

describe("CSS Quality Checker", function() {
  it('correctly identifies minified CSS as minified', function() {
    var someCss = app.cssIsMinified('.moo{background-color:"red";');

    expect(someCss).toBe(true);
  });

  it('correctly identifies unminified CSS as unminified', function() {
    var css = `
      .moo {
        background-color: "red";
      }
    `;
    var someCss = app.cssIsMinified(css);

    expect(someCss).toBe(false);
  });
});
