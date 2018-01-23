/**
 * Browser dependencies
 */
const { wp } = window;

export default function( editor ) {
	const mceEmojiAttrs = {
		'data-mce-resize': 'false',
		'data-mce-placeholder': '1',
		'data-wp-emoji': '1',
	};

	let isTyping = false;

	editor.on( 'keydown keyup', ( { type } ) => {
		isTyping = ( type === 'keydown' );
	} );

	function parse( { withBookmark } ) {
		if ( ! wp.emoji ) {
			return;
		}

		const node = editor.selection.getNode();

		if ( ! wp.emoji.test( node.textContent ) ) {
			return;
		}

		const bookmark = withBookmark ? editor.selection.getBookmark() : null;

		wp.emoji.parse( node, { imgAttr: mceEmojiAttrs } );

		if ( bookmark ) {
			editor.selection.moveToBookmark( bookmark );
		}
	}

	// Most browsers trigger input, but no typing events, on inserting emoji.
	editor.on( 'input', () => {
		if ( ! isTyping ) {
			parse( { withBookmark: true } );
		}
	} );

	// Windows 8+ triggers normal keyboard events with keyCode 231.
	editor.on( 'keyup', ( { keyCode } ) => {
		if ( keyCode === 231 ) {
			parse( { withBookmark: true } );
		}
	} );

	editor.on( 'setcontent', ( { selection } ) => {
		parse( { withBookmark: selection } );
	} );
}
