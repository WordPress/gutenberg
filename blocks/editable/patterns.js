/* eslint-disable */

/**
 * External dependencies
 */
import tinymce from 'tinymce';
import { find, get, escapeRegExp, trimStart, partition, drop } from 'lodash';

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

	const VK = tinymce.util.VK;
	const settings = editor.settings.wptextpattern || {};

	const patterns = getBlockTypes().reduce( ( acc, blockType ) => {
		const transformsFrom = get( blockType, 'transforms.from', [] );
		const transforms = transformsFrom.filter( ( { type } ) => type === 'pattern' );
		return [ ...acc, ...transforms ];
	}, [] );

	const [ enterPatterns, spacePatterns ] = partition(
		patterns,
		( { regExp } ) => regExp.source.endsWith( '$' ),
	);

	const inlinePatterns = settings.inline || [
		{ delimiter: '`', format: 'code' }
	];

	let canUndo;

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

	function space() {
		if ( ! onReplace ) {
			return;
		}

		// Merge text nodes.
		editor.getBody().normalize();

		const content = getContent();

		if ( ! content.length ) {
			return;
		}

		const firstText = content[ 0 ];

		const { result, pattern } = spacePatterns.reduce( ( acc, pattern ) => {
			const result = pattern.regExp.exec( firstText );
			return result ? { result, pattern } : acc;
		}, null );

		if ( ! result ) {
			return;
		}

		const range = editor.selection.getRng();
		const matchLength = result[ 0 ].length;
		const remainingText = firstText.slice( matchLength );

		// The caret position must be at the end of the match.
		if ( range.startOffset !== matchLength ) {
			return;
		}

		const block = pattern.transform( {
			content: [ remainingText, ...drop( content ) ],
			match: result,
		} );

		onReplace( [ block ] );
	}

	function enter() {
		if ( ! onReplace ) {
			return;
		}

		// Merge text nodes.
		editor.getBody().normalize();

		const content = getContent();

		if ( ! content.length ) {
			return;
		}

		const pattern = find( enterPatterns, ( { regExp } ) => regExp.test( content[ 0 ] ) )

		if ( ! pattern ) {
			return;
		}

		const block = pattern.transform( { content } );

		editor.once( 'keyup', () => onReplace( [ block ] ) );
	}
}
