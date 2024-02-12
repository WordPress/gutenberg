/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

/**
 * React custom hook to bind a source to a block.
 *
 * @param {Object} blockProps      - The block props.
 * @param {Object} sourceArgs      - The source args.
 * @param {string} sourceArgs.kind - Kind of the entity. Default is `postType`.
 * @param {string} sourceArgs.name - Name of the entity.
 * @param {string} sourceArgs.prop - The prop to bind.
 * @param {string} sourceArgs.id   - An entity ID to use instead of the context-provided one. Optional.
 * @return {Object} The source value and setter.
 */
const useSource = ( blockProps, sourceArgs ) => {
	if ( typeof sourceArgs === 'undefined' ) {
		throw new Error( 'The "args" argument is required.' );
	}

	if ( ! sourceArgs?.prop ) {
		throw new Error( 'The "prop" argument is required.' );
	}

	const { context } = blockProps;
	const { kind = 'postType', name: nameFromArgs, prop, id } = sourceArgs;

	const { postType: nameFromContext } = context;

	/*
	 * Entity prop name:
	 * - If `name` is provided in the source args, use it.
	 * - If `name` is not provided in the source args, use the `postType` from the context.
	 * - Otherwise, try to get the current post type from the editor store.
	 */
	const name = useSelect(
		( select ) => {
			if ( nameFromArgs ) {
				return nameFromArgs;
			}

			if ( nameFromContext ) {
				return nameFromContext;
			}

			return select( editorStore ).getCurrentPostType();
		},
		[ nameFromContext, nameFromArgs ]
	);

	const [ value, setValue ] = useEntityProp( kind, name, prop, id );

	function setValueHandler( nextEntityPropValue ) {
		// Ensure the value is a string.
		if ( typeof nextEntityPropValue !== 'string' ) {
			return;
		}

		setValue( nextEntityPropValue );
	}

	return {
		placeholder: null,
		value,
		setValue: setValueHandler,
	};
};

/*
 * Create the product-entity
 * block binding source handler.
 *
 * source ID: `core/entity`
 * args:
 * - prop: The prop of the entity to bind.
 *
 * example:
 * The following metadata will bind the title
 * to the `content` attribute of the block.
 *
 * ```
 * metadata: {
 *   bindings: {
 *     content: {
 *       source: 'core/entity',
 *       args: {
 *         prop: 'title',
 *       },
 *    },
 * },
 * ```
 */
export default {
	name: 'core/entity',
	label: __( 'Entity block-binding source handler' ),
	useSource,
	lockAttributesEditing: false,
};
