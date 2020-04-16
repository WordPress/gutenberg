window.onSave = () => {
	const blocks = window.wp.data.select( 'core/block-editor' ).getBlocks();
	const HTML = window.wp.blocks.serialize( blocks );
	window.ReactNativeWebView.postMessage( HTML );
};

window.insertBlock = () => {
	window.setTimeout( () => {
		const blockHTML = window.insertedBlockHTML; // insertedBlockHTML is injected from the RN side
		const blocks = window.wp.blocks.parse( blockHTML );
		window.wp.data.dispatch( 'core/block-editor' ).resetBlocks( blocks );
	}, 0 );
};

window.onload = () => {
	const wpAdminBar = document.getElementById( 'wpadminbar' );
	const wpToolbar = document.getElementById( 'wp-toolbar' );
	if ( wpAdminBar ) {
		wpAdminBar.style.display = 'none';
	}
	if ( wpToolbar ) {
		wpToolbar.style.display = 'none';
	}

	const content = document.getElementById( 'wpbody-content' );
	if ( content ) {
		const callback = function( mutationsList, observer ) {
			const header = document.getElementsByClassName(
				'edit-post-header'
			)[ 0 ];
			const postTitle = document.getElementById( 'post-title-0' );
			if ( postTitle && header.id === '' ) {
				header.id = 'gb-header';
				header.style.height = 0;
				postTitle.style.display = 'none';
				Array.from( header.children ).forEach( ( child ) => {
					child.style.display = 'none';
				} );

				const headerToolbar = header.getElementsByClassName(
					'edit-post-header-toolbar'
				)[ 0 ];
				headerToolbar.style.display = null;
				headerToolbar.parentNode.style.display = null;
				const inserterToggle = header.getElementsByClassName(
					'block-editor-inserter__toggle'
				)[ 0 ];
				inserterToggle.style.display = 'none';

				const blockToolbar = header.getElementsByClassName(
					'edit-post-header-toolbar__block-toolbar'
				)[ 0 ];
				blockToolbar.style.top = '0px';

				// const skeleton = document.getElementsByClassName(
				// 	'block-editor-editor-skeleton'
				// )[ 0 ];
				//                skeleton.style.top = '0px';

				const appender = document.getElementsByClassName(
					'block-list-appender'
				)[ 0 ];
				if ( appender && appender.id === '' ) {
					appender.id = 'appender';
					appender.style.display = 'none';
				}

				window.insertBlock();
				observer.disconnect();
			}
		};
		/* eslint-disable-next-line no-undef */
		const observer = new MutationObserver( callback );

		const config = { attributes: true, childList: true, subtree: true };
		observer.observe( content, config );
	}
};

/* eslint-disable-next-line no-unused-expressions */
true; // react-native-webview asks for it
