/* global wp, jQuery */
jQuery( function() {
	module( 'shortcode' );

	test( 'next() should find the shortcode', function() {
		var result;

		// Basic
		result = wp.shortcode.next( 'foo', 'this has the [foo] shortcode' );
		equal( result.index, 13, 'foo shortcode found at index 13' );

		result = wp.shortcode.next( 'foo', 'this has the [foo param="foo"] shortcode' );
		equal( result.index, 13, 'foo shortcode with params found at index 13' );
	});

	test( 'next() should not find shortcodes that are not there', function() {
		var result;

		// Not found
		result = wp.shortcode.next( 'bar', 'this has the [foo] shortcode' );
		equal( result, undefined, 'bar shortcode not found' );

		result = wp.shortcode.next( 'bar', 'this has the [foo param="bar"] shortcode' );
		equal( result, undefined, 'bar shortcode not found with params' );
	});

	test( 'next() should find the shortcode when told to start looking beyond the start of the string', function() {
		var result;

		// Starting at indices
		result = wp.shortcode.next( 'foo', 'this has the [foo] shortcode', 12 );
		equal( result.index, 13, 'foo shortcode found before index 13' );

		result = wp.shortcode.next( 'foo', 'this has the [foo] shortcode', 13 );
		equal( result.index, 13, 'foo shortcode found at index 13' );

		result = wp.shortcode.next( 'foo', 'this has the [foo] shortcode', 14 );
		equal( result, undefined, 'foo shortcode not found after index 13' );
	});

	test( 'next() should find the second instances of the shortcode when the starting indice is after the start of the first one', function() {
		var result;

		result = wp.shortcode.next( 'foo', 'this has the [foo] shortcode [foo] twice', 14 );
		equal( result.index, 29, 'foo shortcode found the second foo at index 29' );
	});


	test( 'next() should not find escaped shortcodes', function() {
		var result;

		// Escaped
		result = wp.shortcode.next( 'foo', 'this has the [[foo]] shortcode' );
		equal( result, undefined, 'foo shortcode not found when escaped' );

		result = wp.shortcode.next( 'foo', 'this has the [[foo param="foo"]] shortcode' );
		equal( result, undefined, 'foo shortcode not found when escaped with params' );
	});

	test( 'next() should find shortcodes that are incorrectly escaped by newlines', function() {
		var result;

		result = wp.shortcode.next( 'foo', 'this has the [\n[foo]] shortcode' );
		equal( result.index, 15, 'shortcode found when incorrectly escaping the start of it' );

		result = wp.shortcode.next( 'foo', 'this has the [[foo]\n] shortcode' );
		equal( result.index, 14, 'shortcode found when incorrectly escaping the end of it' );
	});

	test( 'next() should still work when there are not equal ammounts of square brackets', function() {
		var result;

		result = wp.shortcode.next( 'foo', 'this has the [[foo] shortcode' );
		equal( result.index, 14, 'shortcode found when there are offset square brackets' );

		result = wp.shortcode.next( 'foo', 'this has the [foo]] shortcode' );
		equal( result.index, 13, 'shortcode found when there are offset square brackets' );
	});

	test( 'next() should find the second instances of the shortcode when the first one is escaped', function() {
		var result;


		result = wp.shortcode.next( 'foo', 'this has the [[foo]] shortcode [foo] twice' );
		equal( result.index, 31, 'foo shortcode found the non-escaped foo at index 31' );
	});

	test( 'next() should not find shortcodes that are not full matches', function() {
		var result;

		// Stubs
		result = wp.shortcode.next( 'foo', 'this has the [foobar] shortcode' );
		equal( result, undefined, 'stub does not trigger match' );

		result = wp.shortcode.next( 'foobar', 'this has the [foo] shortcode' );
		equal( result, undefined, 'stub does not trigger match' );
	});

	test( 'replace() should replace the shortcode', function() {
		var result;

		// Basic
		result = wp.shortcode.replace( 'foo', 'this has the [foo] shortcode', shortcodeReplaceCallback );
		equal( result, 'this has the bar shortcode', 'foo replaced with bar' );

		result = wp.shortcode.replace( 'foo', 'this has the [foo param="foo"] shortcode', shortcodeReplaceCallback );
		equal( result, 'this has the bar shortcode', 'foo and params replaced with bar' );
	});

	test( 'replace() should not replace the shortcode when it does not match', function() {
		var result;

		// Not found
		result = wp.shortcode.replace( 'bar', 'this has the [foo] shortcode', shortcodeReplaceCallback );
		equal( result, 'this has the [foo] shortcode', 'bar not found' );

		result = wp.shortcode.replace( 'bar', 'this has the [foo param="bar"] shortcode', shortcodeReplaceCallback );
		equal( result, 'this has the [foo param="bar"] shortcode', 'bar not found with params' );
	});

	test( 'replace() should replace the shortcode in all instances of its use', function() {
		var result;

		// Multiple instances
		result = wp.shortcode.replace( 'foo', 'this has the [foo] shortcode [foo] twice', shortcodeReplaceCallback );
		equal( result, 'this has the bar shortcode bar twice', 'foo replaced with bar twice' );

		result = wp.shortcode.replace( 'foo', 'this has the [foo param="foo"] shortcode [foo] twice', shortcodeReplaceCallback );
		equal( result, 'this has the bar shortcode bar twice', 'foo and params replaced with bar twice' );
	});

	test( 'replace() should not replace the escaped shortcodes', function() {
		var result;

		// Escaped
		result = wp.shortcode.replace( 'foo', 'this has the [[foo]] shortcode', shortcodeReplaceCallback );
		equal( result, 'this has the [[foo]] shortcode', 'escaped foo not replaced' );

		result = wp.shortcode.replace( 'foo', 'this has the [[foo param="bar"]] shortcode', shortcodeReplaceCallback );
		equal( result, 'this has the [[foo param="bar"]] shortcode', 'escaped foo with params not replaced' );

		result = wp.shortcode.replace( 'foo', 'this [foo] has the [[foo param="bar"]] shortcode escaped', shortcodeReplaceCallback );
		equal( result, 'this bar has the [[foo param="bar"]] shortcode escaped', 'escaped foo with params not replaced but unescaped foo replaced' );
	});

	test( 'replace() should replace improperly escaped shortcodes that include newlines', function() {
		var result;

		result = wp.shortcode.replace( 'foo', 'this [foo] has the [[foo param="bar"]\n] shortcode ', shortcodeReplaceCallback );
		equal( result, 'this bar has the [bar\n] shortcode ', 'escaping with newlines should not actually escape the content' );

		result = wp.shortcode.replace( 'foo', 'this [foo] has the [\n[foo param="bar"]] shortcode ', shortcodeReplaceCallback );
		equal( result, 'this bar has the [\nbar] shortcode ', 'escaping with newlines should not actually escape the content' );
	});

	test( 'replace() should not replace the shortcode when it is an incomplete match', function() {
		var result;

		// Stubs
		result = wp.shortcode.replace( 'foo', 'this has the [foobar] shortcode', shortcodeReplaceCallback );
		equal( result, 'this has the [foobar] shortcode', 'stub not replaced' );

		result = wp.shortcode.replace( 'foobar', 'this has the [foo] shortcode', shortcodeReplaceCallback );
		equal( result, 'this has the [foo] shortcode', 'stub not replaced' );
	});

    // A callback function for the replace tests
	function shortcodeReplaceCallback( ) {
		return 'bar';
	}

    test( 'attrs() should return named attributes created with single, double, and no quotes', function() {
        var expected = {
            'named': {
                'param': 'foo',
                'another': 'bar',
                'andagain': 'baz'
            }, 'numeric' : []
        };

        deepEqual( wp.shortcode.attrs('param="foo" another=\'bar\' andagain=baz'), expected, 'attr parsed all three named types');
    });

    test( 'attrs() should return numeric attributes in the order they are used', function() {
        var expected = {
            'named': {}, 'numeric' : ['foo', 'bar', 'baz']
        };

        deepEqual( wp.shortcode.attrs('foo bar baz'), expected, 'attr parsed numeric attributes');
    });

    test( 'attrs() should return numeric attributes in the order they are used when they have named attributes in between', function() {
        var expected = {
            'named': { 'not': 'a blocker'  }, 'numeric' : ['foo', 'bar', 'baz']
        };

        deepEqual( wp.shortcode.attrs('foo not="a blocker" bar baz'), expected, 'attr parsed numeric attributes');
    });
});
