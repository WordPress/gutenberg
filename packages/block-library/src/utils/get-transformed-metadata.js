/**
 * WordPress dependencies
 */
import { getBlockType } from '@wordpress/blocks';

/**
 * Transform the metadata attribute with only the values and bindings specified by each transform.
 * Returns `undefined` if the input metadata is falsy.
 *
 * @param {Object} metadata      Original metadata attribute from the block that is being transformed.
 * @param {Array}  fromBlockName Name of the original block that is being transformed.
 * @param {Object} toBlockName   Name of the final block after the transformation.
 * @return {Object|undefined} New metadata object only with the relevant properties.
 */
export function getTransformedMetadata( metadata, fromBlockName, toBlockName ) {
	if ( ! metadata ) {
		return;
	}
	const { supports } = getBlockType( toBlockName );
	// Fixed until an opt-in mechanism is implemented.
	const BLOCK_BINDINGS_SUPPORTED_BLOCKS = [
		'core/paragraph',
		'core/heading',
		'core/image',
		'core/button',
	];
	// Fixed until a proper mechanism is defined.
	const BINDINGS_ATTRIBUTES_MAPPING = {
		'core/paragraph': {
			content: {
				'core/heading': 'content',
				'core/button': 'text',
			},
		},
		'core/heading': {
			content: {
				'core/paragraph': 'content',
				'core/button': 'text',
			},
		},
		'core/button': {
			text: {
				'core/paragraph': 'content',
				'core/heading': 'content',
			},
		},
	};
	// The metadata properties that should be preserved after the transform.
	const transformSupportedProps = [];
	// If it support bindings, add the `id` and `bindings` properties.
	if ( BLOCK_BINDINGS_SUPPORTED_BLOCKS.includes( toBlockName ) ) {
		transformSupportedProps.push( 'id', 'bindings' );
	}
	// If it support block naming (true by default), add the `name` property.
	if ( supports.renaming !== false ) {
		transformSupportedProps.push( 'name' );
	}

	return Object.entries( metadata ).reduce( ( obj, [ prop, value ] ) => {
		// If prop is not supported, don't add it to the new metadata object.
		if ( ! transformSupportedProps.includes( prop ) ) {
			return obj;
		}

		if ( prop === 'bindings' ) {
			// Adapt bindings object based on the mapping.
			obj[ prop ] = Object.entries( value ).reduce(
				( transformedObj, [ originalKey, originalObj ] ) => {
					const transformedKey =
						BINDINGS_ATTRIBUTES_MAPPING[ fromBlockName ][
							originalKey
						][ toBlockName ];

					transformedObj[ transformedKey ] = originalObj;
					return transformedObj;
				},
				{}
			);
		} else {
			obj[ prop ] = value;
		}

		return obj;
	}, {} );
}
