/**
 * External dependencies
 */
import morphdom from 'morphdom';

const load = () => {
	const link = document.querySelector(
		'.wp-block-latest-comments-filter .slider'
	);

	link.addEventListener( 'change', async ( e ) => {
		const newBlock = await loadBlock(
			window.location.origin +
				`/wp-json/wp/v2/block-renderer/core/latest-comments?context=edit&attributes[commentsToShow]=${ e.target.value }&post_id=1`
		);

		// Find the root of the block.
		const root = document.querySelector( '.wp-block-latest-comments' );

		// Replace root with the new HTML.
		morphdom( root, newBlock );
	} );
};

window.addEventListener( 'load', load );

async function loadBlock( url ) {
	const data = await window.fetch( url );
	const json = await data.json();
	return json.rendered;
}
