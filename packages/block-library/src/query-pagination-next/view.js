/**
 * External dependencies
 */
import morphdom from 'morphdom';

const load = () => {
	const link = document.querySelector( '.wp-block-query-pagination-next' );

	link.addEventListener( 'click', async ( e ) => {
		e.preventDefault();

		// Fetch the HTML of the new page.
		const url = e.target.href;
		const html = await loadHtml( url );

		// Find the root of the real DOM and the new page.
		const root = document.querySelector( '.wp-site-blocks' );
		const newRoot = /<div class="wp-site-blocks".*<\/div>/s.exec(
			html
		)[ 0 ];

		// Replace root with the new HTML.
		morphdom( root, newRoot );

		// Change the browser URL.
		window.history.pushState( {}, '', url );

		// Scroll to the top to simulate page load.
		window.scrollTo( 0, 0 );

		// Rehydrate
		load();
	} );
};

window.addEventListener( 'load', load );

async function loadHtml( url ) {
	const data = await window.fetch( url );
	const html = await data.text();
	return html;
}
