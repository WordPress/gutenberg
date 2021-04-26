/**
 * Queries the WordPress data module.
 *
 * @param {string}    store      Store to query e.g: core/editor, core/blocks...
 * @param {string}    selector   Selector to exectute e.g: getBlocks.
 * @param {...Object} parameters Parameters to pass to the selector.
 *
 * @return {Promise<?Object>} Result of querying. test
 */
export async function wpDataSelect( store, selector, ...parameters ) {
	return page.evaluate(
		( _store, _selector, ..._parameters ) => {
			const data = window.wp.data
				.select( _store )
				[ _selector ]( ..._parameters );
			return JSON.parse( JSON.stringify( data ) );
		},
		store,
		selector,
		...parameters
	);
}
