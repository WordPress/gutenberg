window.blockEditorSelect =
	window.wp.data.select( 'core/block-editor' ) ||
	window.wp.data.select( 'core/editor' ); // For WP v5.0 and v5.1

window.blockEditorDispatch =
	window.wp.data.dispatch( 'core/block-editor' ) ||
	window.wp.data.dispatch( 'core/editor' ); // For WP v5.0 and v5.1

window.getHTMLPostContent = () => {
	const blocks = window.blockEditorSelect.getBlocks();
	const HTML = window.wp.blocks.serialize( blocks );
	// Check if platform is iOS
	if ( window.webkit ) {
		window.webkit.messageHandlers.htmlPostContent.postMessage( HTML );
		// Otherwise it\'s Android
	} else {
		window.wpwebkit.postMessage( HTML );
	}
};

window.insertBlock = ( blockHTML ) => {
	// Setup the editor with the inserted block
	const post = window.wp.data.select( 'core/editor' ).getCurrentPost();
	window.wp.data
		.dispatch( 'core/editor' )
		.setupEditor( post, { content: blockHTML } );

	// Select the first block
	const clientId = window.blockEditorSelect.getBlocks()[ 0 ].clientId;
	window.blockEditorDispatch.selectBlock( clientId );
};
