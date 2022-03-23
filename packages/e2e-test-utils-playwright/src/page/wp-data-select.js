/**
 * Queries the WordPress data module.
 *
 * `page.evaluate` - used in the function - returns `undefined`
 * when it encounters a non-serializable value.
 * Since we store many different values in the data module,
 * you can end up with an `undefined` result. Before using
 * this function, make sure the data you are querying
 * doesn't contain non-serializable values, for example,
 * functions, DOM element handles, etc.
 *
 * @see https://pptr.dev/#?product=Puppeteer&version=v9.0.0&show=api-pageevaluatepagefunction-args
 * @see https://github.com/WordPress/gutenberg/pull/31199
 *
 * @this {import('./').PageUtils}
 *
 * @param {string}    store      Store to query e.g: core/editor, core/blocks...
 * @param {string}    selector   Selector to exectute e.g: getBlocks.
 * @param {...Object} parameters Parameters to pass to the selector.
 *
 * @return {Promise<?Object>} Result of querying.
 */
export async function wpDataSelect( store, selector, ...parameters ) {
	return this.page.evaluate(
		( _store, _selector, ..._parameters ) => {
			return window.wp.data
				.select( _store )
				[ _selector ]( ..._parameters );
		},
		store,
		selector,
		...parameters
	);
}
