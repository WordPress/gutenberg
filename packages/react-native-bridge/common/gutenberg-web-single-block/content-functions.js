window.getBlockEditorStore = () => {
	return {
		blockEditorSelect:
			window.wp.data.select( 'core/block-editor' ) ||
			window.wp.data.select( 'core/editor' ), // For WP v5.0 and v5.1.

		blockEditorDispatch:
			window.wp.data.dispatch( 'core/block-editor' ) ||
			window.wp.data.dispatch( 'core/editor' ), // For WP v5.0 and v5.1.
	};
};

window.getHTMLPostContent = () => {
	const { blockEditorSelect } = window.getBlockEditorStore();

	const blocks = blockEditorSelect.getBlocks();
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
	const {
		blockEditorSelect,
		blockEditorDispatch,
	} = window.getBlockEditorStore();

	// Setup the editor with the inserted block.
	const post = window.wp.data.select( 'core/editor' ).getCurrentPost();
	window.wp.data
		.dispatch( 'core/editor' )
		.setupEditor( post, { content: blockHTML } );

	// Select the first block.
	const clientId = blockEditorSelect.getBlocks()[ 0 ].clientId;
	blockEditorDispatch.selectBlock( clientId );

	window.contentIncerted = true;
};

window.sendGutenbergReadyMessage = () => {
	if ( window.webkit ) {
		// iOS
		window.webkit.messageHandlers.gutenbergReady.postMessage( '' );
	} else {
		// Android
		window.wpwebkit.gutenbergReady();
	}
	window.readyMessageSent = true;
};

window.isGutenbergReady = () => {
	const currentPost = window.wp.data.select( 'core/editor' ).getCurrentPost();
	return currentPost.id !== undefined;
};

window.startObservingGutenberg = () => {
	if ( window.wp.data && window.subscribed !== true ) {
		if ( window.isGutenbergReady() ) {
			window.sendGutenbergReadyMessage();
			return;
		}

		const unsubscribe = window.wp.data.subscribe( () => {
			if (
				window.isGutenbergReady() &&
				window.readyMessageSent !== true
			) {
				unsubscribe();
				window.sendGutenbergReadyMessage();
			}
		} );
		window.subscribed = true;
	}
};
