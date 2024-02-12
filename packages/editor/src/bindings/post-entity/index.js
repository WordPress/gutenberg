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

	if ( ! sourceArgs?.name ) {
		throw new Error( 'The "name" argument is required.' );
	}

	const { context } = blockProps;
	const { postType: contextPostType } = context;

	const { name: entityName, entity: entityType = 'postType' } = sourceArgs;

	const postType = useSelect(
		( select ) => {
			return contextPostType
				? contextPostType
				: select( editorStore ).getCurrentPostType();
		},
		[ contextPostType ]
	);

	const [ entityValue, setEntityValue ] = useEntityProp(
		entityType,
		postType,
		entityName
	);

	return {
		placeholder: null,
		useValue: [
			entityValue,
			( nextEntityPropValue ) => {
				if ( typeof nextEntityPropValue !== 'string' ) {
					return;
				}
				setEntityValue( nextEntityPropValue );
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
 * - name: The name of the entity to bind.
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
 *         name: 'title',
 *       },
 *    },
 * },
 * ```
 */
export default {
	name: 'core/post-entity',
	label: __( 'Post Entity block-binding source handler' ),
	useSource,
	lockAttributesEditing: false,
};
