/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { _x } from '@wordpress/i18n';
import { useContext } from '@wordpress/element';
import { BlockContext } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../store';

export default {
	name: 'core/post-meta',
	label: _x( 'Post Meta', 'block bindings source' ),
	useSource( props, sourceAttributes ) {
		const context = useContext( BlockContext );
		const { getCurrentPostType } = useSelect( editorStore );
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
			value: metaValue,
			updateValue: updateMetaValue,
		};
	},
};
