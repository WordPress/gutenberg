/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { select } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { store as editorStore } from '../store';

const { getCurrentPostType } = select( editorStore );

export default {
	name: 'post_meta',
	label: 'Post Meta',
	useSource( props, sourceAttributes ) {
		const { context } = props;
		const { value: metaKey } = sourceAttributes;
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
};
