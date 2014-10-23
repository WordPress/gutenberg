module( 'tinymce.html.Obsolete', {
	setupModule: function() {
		QUnit.stop();

		tinymce.init({
			selector: 'textarea',
			plugins: wpPlugins,
			add_unload_trigger : false,
			skin: false,
			indent : false,
			entities : 'raw',
			plugins: 'media',
			convert_urls : false,
			init_instance_callback : function(ed) {
				window.editor = ed;
				QUnit.start();
			}
		});
	}
});

/**
 * Test whether attribute exists in a HTML string
 *
 * @param html The HTML string
 * @param attr string|object When string, test for the first instance of attr.
 *			When object, break up the HTML string into individual tags and test for attr in the specified tag.
 *			Format: { tagName: 'attr1 attr2', ... }
 * @return bool
 */
function hasAttr( html, attr ) {
	var tagName, tags, tag, array, regex, i;

	if ( typeof attr === 'string' ) {
		return new RegExp( ' \\b' + attr + '\\b' ).test( html );
	}

	for ( tagName in attr ) {
		if ( tags = html.match( new RegExp( '<' + tagName + ' [^>]+>', 'g' ) ) ) {
			for ( tag in tags ) {
				array = attr[tagName].split(' ');

				for ( i in array ) {
					regex = new RegExp( '\\b' + array[i] + '\\b' );

					if ( regex.test( tags[tag] ) ) {
						attr[tagName] = attr[tagName].replace( regex, '' );
					}
				}
			}

			if ( attr[tagName].replace( / +/g, '' ).length ) {
				return false;
			}
		}
	}
	return true;
}

// Ref: http://www.w3.org/TR/html5/obsolete.html, http://developers.whatwg.org/obsolete.html

test('HTML elements non-conforming to HTML 5.0', function() {
	var testString;

	/*
	Not supported, deprecated in HTML 4.0 or earlier, and/or proprietary:
		applet
		bgsound
		dir
		frame
		frameset
		noframes
		isindex
		listing
		nextid
		noembed
		plaintext
		rb
		xmp
		basefont
		blink
		marquee
		multicol
		nobr
		spacer

	The rest are still supported in TinyMCE but "...must not be used by authors".
	*/

	expect(6);

	text = 'acronym';
	testString = '<p><acronym title="www">WWW</acronym></p>';
	editor.setContent( testString );
	equal( editor.getContent(), testString, text );

	text = 'strike, converted to span';
	editor.setContent( '<strike>test</strike>' );
	equal( editor.getContent(), '<p><span style="text-decoration: line-through;">test</span></p>', text );

	text = 'big';
	testString = '<p><big>test</big></p>';
	editor.setContent( testString );
	equal( editor.getContent(), testString, text );

	text = 'center';
	testString = '<center>test</center>';
	editor.setContent( testString );
	equal( editor.getContent(), testString, text );

	text = 'font, converted to span';
	editor.setContent( '<p><font size="4">test</font></p>' );
	equal( editor.getContent(), '<p><span style="font-size: large;">test</span></p>', text );

	text = 'tt';
	testString = '<p><tt>test</tt></p>';
	editor.setContent( testString );
	equal( editor.getContent(), testString, text );
});

test('Obsolete (but still conforming) HTML attributes', function() {
	var testString;

	expect(3);

	text = 'border on <img>';
	testString = '<p><img src="../../test.gif" alt="" border="5" /></p>';
	editor.setContent( testString );
	equal( editor.getContent(), testString, text );

	text = 'Old style anchors';
	testString = '<p><a name="test"></a></p>';
	editor.setContent( testString );
	equal( editor.getContent(), testString, text );

	text = 'maxlength, size on input type="number"';
	testString = '<p><input maxlength="5" size="10" type="number" value="" /></p>';
	editor.setContent( testString );
	ok( hasAttr( editor.getContent(), { input: 'maxlength size' } ), text );
});

test('Obsolete attributes in HTML 5.0', function() {
	var testString, text;

	expect(22);

	text = 'charset, rev, shape, coords on <a> elements';
	testString = '<p><a href="javascript;:" charset="en" rev="made" shape="rect" coords="5,5">test</a></p>';
	editor.setContent( testString );
	ok( hasAttr( editor.getContent(), { a: 'charset rev shape coords' } ), text );

	text = 'name, align, hspace, vspace on img elements';
	testString = '<p><img src="../../test.gif" alt="" name="test" align="left" hspace="5" vspace="5" /></p>';
	editor.setContent( testString );
	ok( hasAttr( editor.getContent(), { img: 'name align hspace vspace' } ), text );

	text = 'name, align, hspace, vspace, on embed elements';
	testString = '<p><embed width="100" height="100" src="test.swf" vspace="5" hspace="5" align="left" name="test"></embed></p>';
	editor.setContent( testString );
	ok( hasAttr( editor.getContent(), { embed: 'name align hspace vspace' } ), text );

	text = 'archive, classid, code, codebase, codetype, declare, standby on object elements';
	testString = '<p><object width="100" height="100" classid="clsid" codebase="clsid" standby="standby" codetype="1" code="1" archive="1" declare="declare"></object></p>';
	editor.setContent( testString );
	ok( hasAttr( editor.getContent(), { object: 'archive classid code codebase codetype declare standby' } ), text );

	text = 'type, valuetype on param elements';
	testString = '<p><object width="100" height="100"><param type="" valuetype="" /></object></p>';
	editor.setContent( testString );
	ok( hasAttr( editor.getContent(), { param: 'type valuetype' } ), text );

	text = 'align, bgcolor, border, cellpadding, cellspacing, frame, rules, summary, width on table elements';
	testString = '<table border="1" summary="" width="100" frame="" rules="" cellspacing="5" cellpadding="5" align="left" bgcolor="blue"><tbody><tr><td>test</td></tr></tbody></table>';
	editor.setContent( testString );
	ok( hasAttr( editor.getContent(), { table: 'align bgcolor border cellpadding cellspacing frame rules summary width' } ), text );

	text = 'align, char, charoff, valign on tbody, thead, and tfoot elements';
	testString = '<table><thead align="left" char="" charoff="" valign="top"></thead><tfoot align="left" char="" charoff="" valign="top"></tfoot><tbody align="left" char="" charoff="" valign="top"><tr><th>test</th><td>test</td></tr></tbody></table>';
	editor.setContent( testString );
	ok( hasAttr( editor.getContent(), {
		thead: 'align char charoff valign',
		tfoot: 'align char charoff valign',
		tbody: 'align char charoff valign'
	} ), text );

	text = 'axis, align, bgcolor, char, charoff, height, nowrap, valign, width on td and th elements, scope on td elements';
	testString = '<table><tbody><tr><th axis="" align="left" char="" charoff="" valign="top" nowrap="nowrap" bgcolor="blue" width="100" height="10">test</th><td axis="" align="left" char="" charoff="" valign="top" nowrap="nowrap" bgcolor="blue" width="100" height="10" scope="">test</td></tr></tbody></table>';
	editor.setContent( testString );
	ok( hasAttr( editor.getContent(), {
		th: 'axis align bgcolor char charoff height nowrap valign width',
		td: 'axis align bgcolor char charoff height nowrap valign width scope'
	} ), text );

	text = 'align, bgcolor, char, charoff, valign on tr elements';
	testString = '<table><tbody><tr align="left" char="" charoff="" valign="top" bgcolor="blue"><td>test</td></tr></tbody></table>';
	editor.setContent( testString );
	ok( hasAttr( editor.getContent(), { tr: 'align bgcolor char charoff valign' } ), text );

	text = 'clear on br elements';
	testString = '<p>test<br clear="all" />test</p>';
	editor.setContent( testString );
	equal( editor.getContent(), testString, text );

	text = 'align on caption elements';
	testString = '<table><caption align="left">test</caption><tbody><tr><td>test</td></tr></tbody></table>';
	editor.setContent( testString );
	equal( editor.getContent(), testString, text );

	text = 'align, char, charoff, valign, width on col elements';
	testString = '<table><colgroup><col width="100" align="left" char="a" charoff="1" valign="top" /><col /></colgroup><tbody><tr><td>test</td><td>test</td></tr></tbody></table>';
	editor.setContent( testString );
	ok( hasAttr( editor.getContent(), { col: 'align char charoff valign width' } ), text );

	text = 'align on div, h1—h6, input, legend, p elements';
	testString = '<div align="left">1</div><h3 align="left">1</h3><p align="left">1</p><form><fieldset><legend align="left">test</legend><input type="text" align="left" /></fieldset></form>';
	editor.setContent( testString );
	equal( editor.getContent(), testString, text );

	text = 'compact on dl elements';
	testString = '<dl compact="compact"><dd>1</dd></dl>';
	editor.setContent( testString );
	equal( editor.getContent(), testString, text );

	text = 'align, hspace, vspace on embed elements';
	testString = '<p><embed width="100" height="100" vspace="5" hspace="5" align="left"></embed></p>';
	editor.setContent( testString );
	ok( hasAttr( editor.getContent(), { embed: 'align hspace vspace' } ), text );

	text = 'align, noshade, size, width on hr elements';
	testString = '<hr align="left" noshade="noshade" size="1" width="100" />';
	editor.setContent( testString );
	ok( hasAttr( editor.getContent(), { hr: 'align noshade size width' } ), text );

	text = 'align, frameborder, marginheight, marginwidth, scrolling on iframe elements';
	testString = '<p><iframe width="100" height="100" frameborder="1" marginwidth="5" marginheight="5" scrolling="" align="left"></iframe></p>';
	editor.setContent( testString );
	ok( hasAttr( editor.getContent(), { iframe: 'align frameborder marginheight marginwidth scrolling' } ), text );

	text = 'type on li elements';
	testString = '<ul><li type="disc">test</li></ul>';
	editor.setContent( testString );
	equal( editor.getContent(), testString, text );

	text = 'align, border, hspace, vspace on object elements';
	testString = '<p><object width="100" height="100" border="1" vspace="5" hspace="5" align="left"></object></p>';
	editor.setContent( testString );
	ok( hasAttr( editor.getContent(), { object: 'align border hspace vspace' } ), text );

	text = 'compact on ol elements';
	testString = '<ol compact="compact"><li>test</li></ol>';
	editor.setContent( testString );
	equal( editor.getContent(), testString, text );

	text = 'compact, type on ul elements';
	testString = '<ul type="disc" compact="compact"><li>test</li></ul>';
	editor.setContent( testString );
	ok( hasAttr( editor.getContent(), { ul: 'compact type' } ), text );

	text = 'width on pre elements';
	testString = '<pre width="100">1</pre>';
	editor.setContent( testString );
	equal( editor.getContent(), testString, text );
});
