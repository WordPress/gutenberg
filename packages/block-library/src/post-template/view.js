// Necessary for some themes such as TT1 Blocks, where
// scripts could be loaded before the body.
window.addEventListener( 'load', () => {
	const postBlocks = document.querySelectorAll(
		'.wp-block-post-template .wp-block-post'
	);

	postBlocks.forEach( ( postCard ) => {
		const link = postCard.querySelector( '.wp-block-post-title a' );
		if ( link ) {
			postCard.addEventListener( 'click', () => {
				link.click();
			} );
			postCard.classList.add( 'is-clickable' );
		}
	} );
} );
