/* eslint-disable */

/**
 * External dependencies
 */
import tinymce from 'tinymce';
import { find, get, escapeRegExp, trimStart } from 'lodash';

/**
 * WordPress dependencies
 */
import { ESCAPE, ENTER, SPACE, BACKSPACE } from 'utils/keycodes';

/**
 * Internal dependencies
 */
import { getBlockTypes } from '../api/registration';

/**
 * Browser dependencies
 */
const { setTimeout } = window;

export default function( editor ) {
	const getContent = this.getContent.bind( this );
	const { onReplace } = this.props;

	var VK = tinymce.util.VK;
	var settings = editor.settings.wptextpattern || {};

	const spacePatterns = getBlockTypes().reduce( ( acc, blockType ) => {
		const transformsFrom = get( blockType, 'transforms.from', [] );
		const transforms = transformsFrom.filter( ( { type } ) => type === 'pattern' );
		return [ ...acc, ...transforms ];
	}, [] );

	var enterPatterns = settings.enter || [
		// { start: '##', format: 'h2' },
		// { start: '###', format: 'h3' },
		// { start: '####', format: 'h4' },
		// { start: '#####', format: 'h5' },
		// { start: '######', format: 'h6' },
		// { start: '>', format: 'blockquote' },
		// { regExp: /^(-){3,}$/, element: 'hr' }
	];

	var inlinePatterns = settings.inline || [
		{ delimiter: '`', format: 'code' }
	];

	var canUndo;

	editor.on( 'selectionchange', function() {
		canUndo = null;
	} );

	editor.on( 'keydown', function( event ) {
		const { keyCode } = event;

		if ( ( canUndo && keyCode === ESCAPE ) || ( canUndo === 'space' && keyCode === BACKSPACE ) ) {
			editor.undoManager.undo();
			event.preventDefault();
			event.stopImmediatePropagation();
		}

		if ( VK.metaKeyPressed( event ) ) {
			return;
		}

		if ( keyCode === ENTER ) {
			enter();
		// Wait for the browser to insert the character.
		} else if ( keyCode === SPACE ) {
			setTimeout( space );
		} else if ( keyCode > 47 && ! ( keyCode >= 91 && keyCode <= 93 ) ) {
			setTimeout( inline );
		}
	}, true );

	function inline() {
		var rng = editor.selection.getRng();
		var node = rng.startContainer;
		var offset = rng.startOffset;
		var startOffset;
		var endOffset;
		var pattern;
		var format;
		var zero;

		// We need a non empty text node with an offset greater than zero.
		if ( ! node || node.nodeType !== 3 || ! node.data.length || ! offset ) {
			return;
		}

		var string = node.data.slice( 0, offset );
		var lastChar = node.data.charAt( offset - 1 );

		tinymce.each( inlinePatterns, function( p ) {
			// Character before selection should be delimiter.
			if ( lastChar !== p.delimiter.slice( -1 ) ) {
				return;
			}

			var escDelimiter = escapeRegExp( p.delimiter );
			var delimiterFirstChar = p.delimiter.charAt( 0 );
			var regExp = new RegExp( '(.*)' + escDelimiter + '.+' + escDelimiter + '$' );
			var match = string.match( regExp );

			if ( ! match ) {
				return;
			}

			startOffset = match[1].length;
			endOffset = offset - p.delimiter.length;

			var before = string.charAt( startOffset - 1 );
			var after = string.charAt( startOffset + p.delimiter.length );

			// test*test* => format applied
			// test *test* => applied
			// test* test* => not applied
			if ( startOffset && /\S/.test( before ) ) {
				if ( /\s/.test( after ) || before === delimiterFirstChar ) {
					return;
				}
			}

			// Do not replace when only whitespace and delimiter characters.
			if ( ( new RegExp( '^[\\s' + escapeRegExp( delimiterFirstChar ) + ']+$' ) ).test( string.slice( startOffset, endOffset ) ) ) {
				return;
			}

			pattern = p;

			return false;
		} );

		if ( ! pattern ) {
			return;
		}

		format = editor.formatter.get( pattern.format );

		if ( format && format[0].inline ) {
			editor.undoManager.add();

			editor.undoManager.transact( function() {
				node.insertData( offset, '\uFEFF' );

				node = node.splitText( startOffset );
				zero = node.splitText( offset - startOffset );

				node.deleteData( 0, pattern.delimiter.length );
				node.deleteData( node.data.length - pattern.delimiter.length, pattern.delimiter.length );

				editor.formatter.apply( pattern.format, {}, node );

				editor.selection.setCursorLocation( zero, 1 );
			} );

			// We need to wait for native events to be triggered.
			setTimeout( function() {
				canUndo = 'space';

				editor.once( 'selectionchange', function() {
					var offset;

					if ( zero ) {
						offset = zero.data.indexOf( '\uFEFF' );

						if ( offset !== -1 ) {
							zero.deleteData( offset, offset + 1 );
						}
					}
				} );
			} );
		}
	}

	function firstTextNode( node ) {
		var parent = editor.dom.getParent( node, 'p' ),
			child;

		if ( ! parent ) {
			return;
		}

		while ( child = parent.firstChild ) {
			if ( child.nodeType !== 3 ) {
				parent = child;
			} else {
				break;
			}
		}

		if ( ! child ) {
			return;
		}

		if ( ! child.data ) {
			if ( child.nextSibling && child.nextSibling.nodeType === 3 ) {
				child = child.nextSibling;
			} else {
				child = null;
			}
		}

		return child;
	}

	function space() {
		var rng = editor.selection.getRng(),
			node = rng.startContainer,
			parent,
			text;

		if ( ! node || firstTextNode( node ) !== node ) {
			return;
		}

		parent = node.parentNode;
		text = node.data;

		tinymce.each( spacePatterns, function( pattern ) {
			var match = text.match( pattern.regExp );

			if ( ! match || rng.startOffset !== match[0].length ) {
				return;
			}

			node.deleteData( 0, match[0].length );

			if ( ! parent.innerHTML ) {
				parent.appendChild( document.createElement( 'br' ) );
			}

			const block = pattern.transform( { content: getContent() } );

			onReplace( [ block ] );

			return false;
		} );
	}

	function enter() {
		var rng = editor.selection.getRng(),
			start = rng.startContainer,
			node = firstTextNode( start ),
			i = enterPatterns.length,
			text, pattern, parent;

		if ( ! node ) {
			return;
		}

		text = node.data;

		while ( i-- ) {
			if ( enterPatterns[ i ].start ) {
				if ( text.indexOf( enterPatterns[ i ].start ) === 0 ) {
					pattern = enterPatterns[ i ];
					break;
				}
			} else if ( enterPatterns[ i ].regExp ) {
				if ( enterPatterns[ i ].regExp.test( text ) ) {
					pattern = enterPatterns[ i ];
					break;
				}
			}
		}

		if ( ! pattern ) {
			return;
		}

		if ( node === start && tinymce.trim( text ) === pattern.start ) {
			return;
		}

		editor.once( 'keyup', function() {
			editor.undoManager.add();

			editor.undoManager.transact( function() {
				if ( pattern.format ) {
					editor.formatter.apply( pattern.format, {}, node );
					node.replaceData( 0, node.data.length, trimStart( node.data.slice( pattern.start.length ) ) );
				} else if ( pattern.element ) {
					parent = node.parentNode && node.parentNode.parentNode;

					if ( parent ) {
						parent.replaceChild( document.createElement( pattern.element ), node.parentNode );
					}
				}
			} );

			// We need to wait for native events to be triggered.
			setTimeout( function() {
				canUndo = 'enter';
			} );
		} );
	}
}
