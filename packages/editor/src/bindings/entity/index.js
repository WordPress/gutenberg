/**
 * External dependencies
 */
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
 * source ID:
 * `woo/product-entity`
 * args:
 * - prop: The name of the entity property to bind.
 *
 * example:
 * ```
 * metadata: {
 *   bindings: {
 *     content: {
 *       source: 'woo/product-entity',
 *       args: {
 *         prop: 'short_description',
 *       },
 *    },
 * },
 * ```
 */
export default {
	name: 'core/entity',
	label: __( 'Core Entity' ),
	useSource,
	lockAttributesEditing: false,
};
