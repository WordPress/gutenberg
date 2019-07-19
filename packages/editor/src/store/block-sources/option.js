/**
 * WordPress dependencies
 */
import { select, dispatch } from '@wordpress/data-controls';

/**
 * Store control invoked upon a state change, responsible for returning an
 * object of dependencies. When a change in dependencies occurs (by shallow
 * equality of the returned object), blocks are reset to apply the new sourced
 * value.
 *
 * @yield {Object} Optional yielded controls.
 *
 * @return {Object} Dependencies as object.
 */
export function* getDependencies() {
	return {
		options: yield select( 'core', 'getSiteOptions', ),
	};
}

/**
 * Given an attribute schema and dependencies data, returns a source value.
 *
 * @param {Object} schema               Block type attribute schema.
 * @param {Object} dependencies         Source dependencies.
 * @param {Object} dependencies.options Site options.
 *
 * @return {Object} Block attribute value.
 */
export function apply( schema, { options } ) {
	return options[ schema.option ];
}

/**
 * Store control invoked upon a block attributes update, responsible for
 * reflecting an update in a site option value.
 *
 * @param {Object} schema Block type attribute schema.
 * @param {*}      value  Updated block attribute value.
 *
 * @yield {Object} Yielded action objects or store controls.
 */
export function* update( schema, value ) {
	const siteOptions = { [ schema.option ]: value };
	yield dispatch( 'core', 'updateSiteOptions', siteOptions );
}
