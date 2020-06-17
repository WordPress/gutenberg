/**
 * Queries the WordPress data module.
 *
 * @param {string}    store      Store to query e.g: core/editor, core/blocks...
 * @param {string}    selector   Selector to exectute e.g: getBlocks.
 * @param {...Object} parameters Parameters to pass to the selector.
 *
 * @return {?Object} Result of querying.
 */
export async function wpDataSelect( store, selector, ...parameters ) {
	return await page.evaluate(
		( [ _store, _selector ] ) => {
			return window.wp.data.select( _store )[ _selector ]();
		},
		[ store, selector ]
	);
}
