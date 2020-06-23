/**
 * Dispatches from the WordPress data module.
 *
 * @param {string}    store      Store to dispatch from e.g: core/editor, core/blocks...
 * @param {string}    action   Action to dispatch e.g: selectBlock.
 * @param {...*} [parameters] Parameters to pass to dispatch action.
 */
export async function wpDataDispatch( store, action, ...parameters ) {
	await page.evaluate(
		( _store, _action, ..._parameters ) =>
			window.wp.data.dispatch( _store )[ _action ]( ..._parameters ),
		store,
		action,
		...parameters
	);
}
