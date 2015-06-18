( function( $, QUnit, tinymce, _type, setTimeout ) {
	var editor,
		count = 0;

	if ( tinymce.Env.ie && tinymce.Env.ie < 9 ) {
		return;
	}

	function type() {
		var args = arguments;

		setTimeout( function() {
			if ( typeof args[0] === 'string' ) {
				args[0] = args[0].split( '' );
			}

			if ( typeof args[0] === 'function' ) {
				args[0]();
			} else {
				_type( args[0].shift() );
			}

			if ( ! args[0].length ) {
				[].shift.call( args );
			}

			if ( args.length ) {
				type.apply( null, args );
			}
		} );
	}

	QUnit.module( 'tinymce.plugins.wptextpattern', {
		beforeEach: function( assert ) {
			var done;

			if ( ! editor ) {
				done = assert.async();

				$( document.body ).append( '<textarea id="editor">' );

				tinymce.init( {
					selector: '#editor',
					skin: false,
					plugins: 'wptextpattern',
					init_instance_callback: function() {
						editor = arguments[0];
						editor.focus();
						editor.selection.setCursorLocation();
						done();
					}
				} );
			} else {
				editor.setContent( '' );
				editor.selection.setCursorLocation();
			}
		},
		afterEach: function( assert ) {
			count++;

			if ( count === assert.test.module.tests.length ) {
				editor.remove();
				$( '#editor' ).remove();
			}
		}
	} );

	QUnit.test( 'Unordered list.', function( assert ) {
		type( '* a', function() {
			assert.equal( editor.getContent(), '<ul>\n<li>a</li>\n</ul>' );
		}, assert.async() );
	} );

	QUnit.test( 'Ordered list.', function( assert ) {
		type( '1. a', function() {
			assert.equal( editor.getContent(), '<ol>\n<li>a</li>\n</ol>' );
		}, assert.async() );
	} );

	QUnit.test( 'Ordered list with content. (1)', function( assert ) {
		editor.setContent( '<p><strong>test</strong></p>' );
		editor.selection.setCursorLocation();

		type( '* ', function() {
			assert.equal( editor.getContent(), '<ul>\n<li><strong>test</strong></li>\n</ul>' );
		}, assert.async() );
	} );

	QUnit.test( 'Ordered list with content. (2)', function( assert ) {
		editor.setContent( '<p><strong>test</strong></p>' );
		editor.selection.setCursorLocation( editor.$( 'p' )[0], 0 );

		type( '* ', function() {
			assert.equal( editor.getContent(), '<ul>\n<li><strong>test</strong></li>\n</ul>' );
		}, assert.async() );
	} );

	QUnit.test( 'Only transform inside a P tag.', function( assert ) {
		editor.setContent( '<h1>test</h1>' );
		editor.selection.setCursorLocation();

		type( '* ', function() {
			assert.equal( editor.getContent(), '<h1>* test</h1>' );
		}, assert.async() );
	} );

	QUnit.test( 'Only transform at the start of a P tag.', function( assert ) {
		editor.setContent( '<p>test <strong>test</strong></p>' );
		editor.selection.setCursorLocation( editor.$( 'strong' )[0].firstChild, 0 );

		type( '* ', function() {
			assert.equal( editor.getContent(), '<p>test <strong>* test</strong></p>' );
		}, assert.async() );
	} );

	QUnit.test( 'Only transform when at the cursor is at the start.', function( assert ) {
		editor.setContent( '<p>* test</p>' );
		editor.selection.setCursorLocation( editor.$( 'p' )[0].firstChild, 6 );

		type( ' a', function() {
			assert.equal( editor.getContent(), '<p>* test a</p>' );
		}, assert.async() );
	} );

	QUnit.test( 'Backspace should undo the transformation.', function( assert ) {
		editor.setContent( '<p>test</p>' );
		editor.selection.setCursorLocation();

		type( '* \b', function() {
			assert.equal( editor.getContent(), '<p>* test</p>' );
			assert.equal( editor.selection.getRng().startOffset, 2 );
		}, assert.async() );
	} );

	QUnit.test( 'Backspace should undo the transformation only right after it happened.', function( assert ) {
		editor.setContent( '<p>test</p>' );
		editor.selection.setCursorLocation();

		type( '* ', function() {
			editor.selection.setCursorLocation( editor.$( 'li' )[0].firstChild, 4 );
			// Gecko.
			editor.fire( 'click' );
		}, '\b', function() {
			assert.equal( editor.getContent(), '<ul>\n<li>tes</li>\n</ul>' );
		}, assert.async() );
	} );
} )( window.jQuery, window.QUnit, window.tinymce, window.Utils.type, window.setTimeout );
