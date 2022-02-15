/**
 * External dependencies
 */
import morphdom from 'morphdom';

const load = () => {
	const link = document.querySelector( '.wp-block-query-pagination-next' );

	link.addEventListener( 'click', async ( e ) => {
		e.preventDefault();

		const {
			block: blockName,
			// attribute,
			// newValue,
			nonce,
		} = e.target.dataset;
		const blockSelector = `.wp-block-${ blockName.replace( 'core/', '' ) }`; // TODO: Need a better mechanism here.

		// TODO: Need to include blocks' current attributes.
		// Fetch the HTML of the new block.
		// const html = await fetchRenderedBlock(
		// 	blockName,
		// 	{ [ attribute ]: newValue },
		// 	nonce
		// ); // FIXME
		const html = await fetchRenderedBlock(
			'core/calendar',
			{ month: '12', year: '2021' },
			nonce
		);

		// Find the root of the real DOM.
		const root = e.target.closest( blockSelector );

		// Replace root with the new HTML.
		morphdom( root, html );

		// Change the browser URL.
		window.history.pushState( {}, '', e.target.href );

		// Scroll to the top to simulate page load.
		window.scrollTo( 0, 0 );

		// Rehydrate
		load();
	} );
};

window.addEventListener( 'load', load );

async function fetchRenderedBlock( blockName, attributes, nonce ) {
	// TODO: Auth should be done inside of this function (or ideally not at all.)
	const route = `wp/v2/block-renderer/${ blockName }`;
	const restApiBase = document.head.querySelector(
		'link[rel="https://api.w.org/"]'
	).href;
	const url = new URL( restApiBase + route );
	for ( const attr in attributes ) {
		url.searchParams.append( `attributes[${ attr }]`, attributes[ attr ] );
	}
	url.searchParams.append( 'context', 'edit' );
	url.searchParams.append( '_locale', 'user' );

	const headers = { 'X-WP-Nonce': nonce };
	const data = await window.fetch( url, { headers } );
	const { rendered } = await data.json();
	return rendered;
}
