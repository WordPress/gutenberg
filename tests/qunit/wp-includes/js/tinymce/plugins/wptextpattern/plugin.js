( function( $, QUnit, tinymce, setTimeout ) {
	var editor,
		count = 0;

	if ( tinymce.Env.ie && tinymce.Env.ie < 9 ) {
		return;
	}

	function mceType( chr, noKeyUp ) {
		var editor = tinymce.activeEditor, keyCode, charCode, evt, startElm, rng, startContainer, startOffset, textNode;

		function charCodeToKeyCode(charCode) {
			var lookup = {
				'0': 48, '1': 49, '2': 50, '3': 51, '4': 52, '5': 53, '6': 54, '7': 55, '8': 56, '9': 57,'a': 65, 'b': 66, 'c': 67,
				'd': 68, 'e': 69, 'f': 70, 'g': 71, 'h': 72, 'i': 73, 'j': 74, 'k': 75, 'l': 76, 'm': 77, 'n': 78, 'o': 79, 'p': 80, 'q': 81,
				'r': 82, 's': 83, 't': 84, 'u': 85,	'v': 86, 'w': 87, 'x': 88, 'y': 89, ' ': 32, ',': 188, '-': 189, '.': 190, '/': 191, '\\': 220,
				'[': 219, ']': 221, '\'': 222, ';': 186, '=': 187, ')': 41,
				'`': 48 // Anything will do.
			};

			return lookup[String.fromCharCode(charCode)];
		}

		function fakeEvent(target, type, evt) {
			editor.dom.fire(target, type, evt);
		}

		// Numeric keyCode
		if (typeof(chr) === 'number') {
			charCode = chr;
			keyCode = charCodeToKeyCode(charCode);
		} else if (typeof(chr) === 'string') {
			// String value
			if (chr === '\b') {
				keyCode = 8;
				charCode = chr.charCodeAt(0);
			} else if (chr === '\n') {
				keyCode = 13;
				charCode = chr.charCodeAt(0);
			} else {
				charCode = chr.charCodeAt(0);
				keyCode = charCodeToKeyCode(charCode);
			}
		} else {
			evt = chr;

			if (evt.charCode) {
				chr = String.fromCharCode(evt.charCode);
			}

			if (evt.keyCode) {
				keyCode = evt.keyCode;
			}
		}

		evt = evt || {keyCode: keyCode, charCode: charCode};

		startElm = editor.selection.getStart();
		fakeEvent(startElm, 'keydown', evt);
		fakeEvent(startElm, 'keypress', evt);

		if (!evt.isDefaultPrevented()) {
			if (keyCode === 8) {
				if (editor.getDoc().selection) {
					rng = editor.getDoc().selection.createRange();

					if (rng.text.length === 0) {
						rng.moveStart('character', -1);
						rng.select();
					}

					rng.execCommand('Delete', false, null);
				} else {
					rng = editor.selection.getRng();
					startContainer = rng.startContainer;

					if (startContainer.nodeType === 1 && rng.collapsed) {
						var nodes = rng.startContainer.childNodes;
						startContainer = nodes[nodes.length - 1];
					}

					// If caret is at <p>abc|</p> and after the abc text node then move it to the end of the text node
					// Expand the range to include the last char <p>ab[c]</p> since IE 11 doesn't delete otherwise
					if ( rng.collapsed && startContainer && startContainer.nodeType === 3 && startContainer.data.length > 0) {
						rng.setStart(startContainer, startContainer.data.length - 1);
						rng.setEnd(startContainer, startContainer.data.length);
						editor.selection.setRng(rng);
					}

					editor.getDoc().execCommand('Delete', false, null);
				}
			} else if (typeof(chr) === 'string') {
				rng = editor.selection.getRng(true);

				if (rng.startContainer.nodeType === 3 && rng.collapsed) {
					// `insertData` may alter the range.
					startContainer = rng.startContainer;
					startOffset = rng.startOffset;
					rng.startContainer.insertData( rng.startOffset, chr );
					rng.setStart( startContainer, startOffset + 1 );
				} else {
					textNode = editor.getDoc().createTextNode(chr);
					rng.insertNode(textNode);
					rng.setStart(textNode, 1);
				}

				rng.collapse(true);
				editor.selection.setRng(rng);
			}
		}

		if ( ! noKeyUp ) {
			fakeEvent(startElm, 'keyup', evt);
		}
	}

	function type() {
		var args = arguments;

		// Wait once for conversions to be triggered,
		// and once for the `canUndo` flag to be set.
		setTimeout( function() {
		setTimeout( function() {
			if ( typeof args[0] === 'string' ) {
				args[0] = args[0].split( '' );
			}

			if ( typeof args[0] === 'function' ) {
				args[0]();
			} else {
				mceType( args[0].shift() );
			}

			if ( ! args[0].length ) {
				[].shift.call( args );
			}

			if ( args.length ) {
				type.apply( null, args );
			}
		} );
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
					wptextpattern: {
						inline: [
							{ delimiter: '`', format: 'code' },
							{ delimiter: '``', format: 'bold' },
							{ delimiter: '```', format: 'italic' }
						]
					},
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

	QUnit.test( 'Unordered list. (fast)', function( assert ) {
		type( '*', function() {
			mceType( ' ', true );
		}, 'a', function() {
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

	QUnit.test( 'Heading 3', function( assert ) {
		editor.setContent( '<p>### test</p>' );
		editor.selection.setCursorLocation( editor.$( 'p' )[0].firstChild, 8 );

		type( '\n', function() {
			assert.equal( editor.$( 'h3' )[0].firstChild.data, 'test' );
			assert.equal( editor.getContent(), '<h3>test</h3>\n<p>&nbsp;</p>' );
		}, assert.async() );
	} );

	QUnit.test( 'Heading 3 with elements.', function( assert ) {
		editor.setContent( '<p>###<del>test</del></p>' );
		editor.selection.setCursorLocation( editor.$( 'del' )[0].firstChild, 4 );

		type( '\n', function() {
			assert.equal( editor.getContent(), '<h3><del>test</del></h3>\n<p>&nbsp;</p>' );
		}, assert.async() );
	} );

	QUnit.test( 'Don\'t convert without content', function( assert ) {
		editor.setContent( '<p>###&nbsp;</p>' );
		editor.selection.setCursorLocation( editor.$( 'p' )[0].firstChild, 4 );

		type( '\n', function() {
			assert.equal( editor.getContent(), '<p>###&nbsp;</p>\n<p>&nbsp;</p>' );
		}, assert.async() );
	} );

	QUnit.test( 'Horizontal Rule', function( assert ) {
		type( '---\n', function() {
			assert.equal( editor.getContent(), '<hr />\n<p>&nbsp;</p>' );
		}, assert.async() );
	} );

	QUnit.test( 'Inline: single character.', function( assert ) {
		type( '`test`', function() {
			assert.equal( editor.getContent(), '<p><code>test</code></p>' );
			assert.equal( editor.selection.getRng().startOffset, 1 );
		}, assert.async() );
	} );

	QUnit.test( 'Inline: two characters.', function( assert ) {
		type( '``test``', function() {
			assert.equal( editor.getContent(), '<p><strong>test</strong></p>' );
			assert.equal( editor.selection.getRng().startOffset, 1 );
		}, assert.async() );
	} );

	QUnit.test( 'Inline: allow spaces within text.', function( assert ) {
		type( '`a a`', function() {
			assert.equal( editor.getContent(), '<p><code>a a</code></p>' );
			assert.equal( editor.selection.getRng().startOffset, 1 );
		}, assert.async() );
	} );

	QUnit.test( 'Inline: disallow \\S-delimiter-\\s.', function( assert ) {
		type( 'a` a`', function() {
			assert.equal( editor.getContent(), '<p>a` a`</p>' );
			assert.equal( editor.selection.getRng().startOffset, 5 );
		}, assert.async() );
	} );

	QUnit.test( 'Inline: allow \\s-delimiter-\\s.', function( assert ) {
		type( 'a ` a`', function() {
			assert.equal( editor.getContent(), '<p>a <code> a</code></p>' );
			assert.equal( editor.selection.getRng().startOffset, 1 );
		}, assert.async() );
	} );

	QUnit.test( 'Inline: allow \\S-delimiter-\\S.', function( assert ) {
		type( 'a`a`', function() {
			assert.equal( editor.getContent(), '<p>a<code>a</code></p>' );
			assert.equal( editor.selection.getRng().startOffset, 1 );
		}, assert.async() );
	} );

	QUnit.test( 'Inline: after typing.', function( assert ) {
		editor.setContent( '<p>test test test</p>' );
		editor.selection.setCursorLocation( editor.$( 'p' )[0].firstChild, 5 );

		type( '`', function() {
			editor.selection.setCursorLocation( editor.$( 'p' )[0].firstChild, 10 );
		}, '`', function() {
			assert.equal( editor.getContent(), '<p>test <code>test</code> test</p>' );
			assert.equal( editor.selection.getRng().startOffset, 1 );
		}, assert.async() );
	} );

	QUnit.test( 'Inline: no change without content.', function( assert ) {
		type( 'test `` ``` ````', function() {
			assert.equal( editor.getContent(), '<p>test `` ``` ````</p>' );
		}, assert.async() );
	} );

	QUnit.test( 'Inline: convert with previously unconverted pattern.', function( assert ) {
		editor.setContent( '<p>`test` test&nbsp;</p>' );
		editor.selection.setCursorLocation( editor.$( 'p' )[0].firstChild, 12 );

		type( '`test`', function() {
			assert.equal( editor.getContent(), '<p>`test` test&nbsp;<code>test</code></p>' );
		}, assert.async() );
	} );

	QUnit.test( 'Inline: convert with previous pattern characters.', function( assert ) {
		editor.setContent( '<p>test``` 123</p>' );
		editor.selection.setCursorLocation( editor.$( 'p' )[0].firstChild, 11 );

		type( '``456``', function() {
			assert.equal( editor.getContent(), '<p>test``` 123<strong>456</strong></p>' );
		}, assert.async() );
	} );

	QUnit.test( 'Inline: disallow after previous pattern characters and leading space.', function( assert ) {
		editor.setContent( '<p>test``` 123</p>' );
		editor.selection.setCursorLocation( editor.$( 'p' )[0].firstChild, 11 );

		type( '``` 456```', function() {
			assert.equal( editor.getContent(), '<p>test``` 123``` 456```</p>' );
		}, assert.async() );
	} );
} )( window.jQuery, window.QUnit, window.tinymce, window.setTimeout );
