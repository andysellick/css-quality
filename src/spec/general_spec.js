/* globals fn, it, describe, expect */

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

  it('converts minified CSS into an array', function() {
    var css = '.noselect{-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none}.invisible,.totallyinvisible{position:absolute;left:-100000px;width:1px;height:1px;overflow:hidden;outline:0}.invisible:focus{position:static;width:auto;height:auto}a,address,article,aside,blockquote,body,button,dd,details,div,dl,dt,fieldset,figcaption,figure,footer,form,h1,h2,h3,h4,h5,h6,header,input,label,legend,li,main,menu,nav,ol,p,section,span,table,tbody,td,tfoot,th,thead,tr,ul{padding:0;margin:0;border:0;background:none;font-style:normal;font-weight:400;outline:0}button{-webkit-appearance:none}';
    var output = fn.convertMinifiedCssToArray(css);
    var expected = [
      '.noselect',
      '-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none',
      '.invisible,.totallyinvisible',
      'position:absolute;left:-100000px;width:1px;height:1px;overflow:hidden;outline:0',
      '.invisible:focus',
      'position:static;width:auto;height:auto',
      'a,address,article,aside,blockquote,body,button,dd,details,div,dl,dt,fieldset,figcaption,figure,footer,form,h1,h2,h3,h4,h5,h6,header,input,label,legend,li,main,menu,nav,ol,p,section,span,table,tbody,td,tfoot,th,thead,tr,ul',
      'padding:0;margin:0;border:0;background:none;font-style:normal;font-weight:400;outline:0',
      'button',
      '-webkit-appearance:none',
    ];

    expect(output).toEqual(expected);
  });

  it('converts CSS into an array of objects', function() {
    var css = [
      '.class1',
      'border: solid 1px red;background: green',
      '.class2, .class3 .class4',
      'border: dotted 4px black;background: orange',
      '.class5',
      'background: red',
    ];
    var output = fn.convertCssToObject(css);
    var expected = [
      {
        'selectors': ['.class1'],
        'line': 1,
        'properties': [
          'border: solid 1px red',
          'background: green'
        ]
      },
      {
        'selectors': ['.class2','.class3 .class4'],
        'line': 5,
        'properties': [
          'border: dotted 4px black',
          'background: orange',
        ]
      },
      {
        'selectors': ['.class5'],
        'line': 10,
        'properties': [
          'background: red',
        ]
      }
    ];
    expect(output).toEqual(expected);
  });

  it('converts a string to an array of selectors or properties', function() {
    var selectors = ".class1,.class2,.class3";
    var output = fn.returnLines(selectors, ",");
    var expected = [
      ".class1",
      ".class2",
      ".class3"
    ];

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
    var expected = [
      false,
      false,
      '#id',
      'body#id',
      false
    ];

    for (var x = 0; x < css.length; x++) {
      expect(fn.findIdUsageInDeclarations(css[x])).toEqual(expected[x]);
    }
  });

  it('finds uses of !important in CSS', function() {
    var line = 'border: solid 1px red !important;';
    var output = fn.findImportantUsageInProperties(line);
    var expected = 'border: solid 1px red !important;';
    expect(output).toEqual(expected);

    line = 'border: solid 1px red ! important;';
    output = fn.findImportantUsageInProperties(line);
    expected = 'border: solid 1px red ! important;';
    expect(output).toEqual(expected);

    line = 'border: solid 1px red;';
    output = fn.findImportantUsageInProperties(line);
    expected = false;
    expect(output).toEqual(expected);
  });

  if('finds qualified selectors in CSS', function(){
    var line = 'div.classname';
    var output = fn.findQualifiedSelectors(line);
    var expected = 'div.classname';
    expect(output).toEqual(expected);

    line = '.classname';
    output = fn.findQualifiedSelectors(line);
    expected = false;
    expect(output).toEqual(expected);

    line = '.class2,div.c2lass,.class.otherclass';
    output = fn.findQualifiedSelectors(line);
    expected = '.class2,div.c2lass,.class.otherclass';
    expect(output).toEqual(expected);

    line = '.class,div.class-name,div.block__element--modifier';
    output = fn.findQualifiedSelectors(line);
    expected = '.class,div.class-name,div.block__element--modifier';
    expect(output).toEqual(expected);
  });

	// it('ignores css conditional comments', function() {
	// 	var html = '<!--[if IE 6]><link rel="stylesheet" media="screen" href="https://w.co.uk/static/ie6.css" /><script>var ieVersion = 6;</script><![endif]-->';
	// 	var output = fn.removeConditionalComments(html);
  //
	// 	expect(output).toEqual('');
	// });


  it('finds the domain part of URLs', function() {
    var url = fn.findDomainFromUrl('http://www.quantpole.co.uk/index.php');
    var expected = 'http://www.quantpole.co.uk';

    expect(url).toEqual(expected);

    url = fn.findDomainFromUrl('http://www.quantpole.co.uk/browse/index.php');
    expected = 'http://www.quantpole.co.uk';

    expect(url).toEqual(expected);
  });
});
