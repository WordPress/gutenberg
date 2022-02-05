// Necessary for some themes such as TT1 Blocks, where
// scripts could be loaded before the body.
window.addEventListener( 'load', () => {
	const postBlocks = document.querySelectorAll(
		'.wp-block-post-template .wp-block-post'
	);

	postBlocks.forEach( ( postBlockElement ) => {
		const link = postBlockElement.querySelector( '.wp-block-post-title a' );
		if ( link ) {
			postBlockElement.addEventListener( 'click', () => {
				link.click();
			} );
			postBlockElement.classList.add( 'is-clickable' );
		}
	} );
} );
