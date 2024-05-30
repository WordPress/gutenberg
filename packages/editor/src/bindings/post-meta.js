/**
 * WordPress dependencies
 */
import { store as coreDataStore } from '@wordpress/core-data';
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../store';

export default {
	name: 'core/post-meta',
	label: _x( 'Post Meta', 'block bindings source' ),
	usesContext: [ 'postId', 'postType' ],
	getPlaceholder( { args } ) {
		return args.key;
	},
	getValue( { select, context, args } ) {
		const postId = context.postId
			? context.postId
			: select( editorStore ).getCurrentPostId();
		const postType = context.postType
			? context.postType
			: select( editorStore ).getCurrentPostType();

		return select( coreDataStore ).getEditedEntityRecord(
			'postType',
			postType,
			postId
		).meta?.[ args.key ];
	},
};
