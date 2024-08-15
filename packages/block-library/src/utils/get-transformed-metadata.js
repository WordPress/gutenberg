/**
 * WordPress dependencies
 */
import { getBlockType } from '@wordpress/blocks';

/**
 * Transform the metadata attribute with only the values and bindings specified by each transform.
 * Returns `undefined` if the input metadata is falsy.
 *
 * @param {Object}   metadata         Original metadata attribute from the block that is being transformed.
 * @param {Object}   newBlockName     Name of the final block after the transformation.
 * @param {Function} bindingsCallback Optional callback to transform the `bindings` property object.
 * @return {Object|undefined} New metadata object only with the relevant properties.
 */
export function getTransformedMetadata(
	metadata,
	newBlockName,
	bindingsCallback
) {
	if ( ! metadata ) {
		return;
	}
	const { supports } = getBlockType( newBlockName );
	// Fixed until an opt-in mechanism is implemented.
	const BLOCK_BINDINGS_SUPPORTED_BLOCKS = [
		'core/paragraph',
		'core/heading',
		'core/image',
		'core/button',
	];
	// The metadata properties that should be preserved after the transform.
	const transformSupportedProps = [];
	// If it support bindings, and there is a transform bindings callback, add the `id` and `bindings` properties.
	if (
		BLOCK_BINDINGS_SUPPORTED_BLOCKS.includes( newBlockName ) &&
		bindingsCallback
	) {
		transformSupportedProps.push( 'id', 'bindings' );
	}
	// If it support block naming (true by default), add the `name` property.
	if ( supports.renaming !== false ) {
		transformSupportedProps.push( 'name' );
	}

	// Return early if no supported properties.
	if ( ! transformSupportedProps.length ) {
		return;
	}

	const newMetadata = Object.entries( metadata ).reduce(
		( obj, [ prop, value ] ) => {
			// If prop is not supported, don't add it to the new metadata object.
			if ( ! transformSupportedProps.includes( prop ) ) {
				return obj;
			}
			obj[ prop ] =
				prop === 'bindings' ? bindingsCallback( value ) : value;
			return obj;
		},
		{}
	);

	// Return undefined if object is empty.
	return Object.keys( newMetadata ).length ? newMetadata : undefined;
}
