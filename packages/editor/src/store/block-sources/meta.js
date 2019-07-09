/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data-controls';

/**
 * Internal dependencies
 */
import { editPost } from '../actions';

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
		meta: yield select( 'core/editor', 'getEditedPostAttribute', 'meta' ),
	};
}

/**
 * Given an attribute schema and dependencies data, returns a source value.
 *
 * @param {Object} schema            Block type attribute schema.
 * @param {Object} dependencies      Source dependencies.
 * @param {Object} dependencies.meta Post meta.
 *
 * @return {Object} Block attribute value.
 */
export function apply( schema, { meta } ) {
	return meta[ schema.meta ];
}

/**
 * Store control invoked upon a block attributes update, responsible for
 * reflecting an update in a meta value.
 *
 * @param {Object} schema Block type attribute schema.
 * @param {*}      value  Updated block attribute value.
 *
 * @yield {Object} Yielded action objects or store controls.
 */
export function* update( schema, value ) {
	yield editPost( {
		meta: {
			[ schema.meta ]: value,
		},
	} );
}
