/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { store as editorStore } from '../store';

export default {
	name: 'core/post-meta',
	label: __( 'Post Meta' ),
	useSource( props, sourceAttributes ) {
		const { getCurrentPostType } = useSelect( editorStore );
		const { context } = props;
		const { key: metaKey } = sourceAttributes;
		const postType = context.postType
			? context.postType
			: getCurrentPostType();
		const [ meta, setMeta ] = useEntityProp(
			'postType',
			context.postType,
			'meta',
			context.postId
		);

		if ( postType === 'wp_template' ) {
			return { placeholder: metaKey };
		}
		const metaValue = meta[ metaKey ];
		const updateMetaValue = ( newValue ) => {
			setMeta( { ...meta, [ metaKey ]: newValue } );
		};
		return {
			placeholder: metaKey,
			useValue: [ metaValue, updateMetaValue ],
		};
	},
	lockAttributesEditing: true,
};
