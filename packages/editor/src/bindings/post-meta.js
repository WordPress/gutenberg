/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { _x } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { store as editorStore } from '../store';

export default {
	name: 'core/post-meta',
	label: _x( 'Post Meta', 'block bindings source' ),
	useSource( props, sourceAttributes, attributeName ) {
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

		let placeholder = metaKey;
		/*
		 * Placeholder fallback.
		 * If the attribute is `url`,
		 * a meta key placeholder can't be used because it is not a valid url.
		 */
		if ( attributeName === 'url' ) {
			placeholder = null;
		}

		if ( postType === 'wp_template' ) {
			return { placeholder };
		}
		const metaValue = meta[ metaKey ];
		const updateMetaValue = ( newValue ) => {
			setMeta( { ...meta, [ metaKey ]: newValue } );
		};

		return {
			placeholder,
			value: metaValue,
			updateValue: updateMetaValue,
		};
	},
};
