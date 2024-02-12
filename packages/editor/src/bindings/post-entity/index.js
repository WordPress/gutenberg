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
 * @param {Object} blockProps - The block props.
 * @param {Object} sourceArgs - The source args.
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
	const { postType: contextPostType } = context;

	const { prop: entityPropName, entity: entityType = 'postType' } =
		sourceArgs;

	const postType = useSelect(
		( select ) => {
			return contextPostType
				? contextPostType
				: select( editorStore ).getCurrentPostType();
		},
		[ contextPostType ]
	);

	const [ entityPropValue, setEntityPropValue ] = useEntityProp(
		entityType,
		postType,
		entityPropName
	);

	return {
		placeholder: null,
		useValue: [
			entityPropValue,
			( nextEntityPropValue ) => {
				if ( typeof nextEntityPropValue !== 'string' ) {
					return;
				}
				setEntityPropValue( nextEntityPropValue );
			},
		],
	};
};

/*
 * Create the product-entity
 * block binding source handler.
 *
 * source ID: `core/post-entity`
 * args:
 * - prop: The name of the post entity property to bind.
 *
 * example:
 * The following metadata will bind the post title
 * to the `content` attribute of the block.
 *
 * ```
 * metadata: {
 *   bindings: {
 *     content: {
 *       source: 'core/post-entity',
 *       args: {
 *         prop: 'title',
 *       },
 *    },
 * },
 * ```
 */
export default {
	name: 'core/post-entity',
	label: __( 'Core Post Entity block binding source' ),
	useSource,
	lockAttributesEditing: false,
};
