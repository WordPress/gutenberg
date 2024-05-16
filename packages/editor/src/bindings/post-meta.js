/**
 * WordPress dependencies
 */
import { store as coreDataStore } from '@wordpress/core-data';
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../store';
import { __experimentalIsAdminUser } from '../store/selectors';

export default {
	name: 'core/post-meta',
	label: _x( 'Post Meta', 'block bindings source' ),
	getPlaceholder( { args } ) {
		return args.key;
	},
	getValue( { registry, context, args } ) {
		const postType = context.postType
			? context.postType
			: registry.select( editorStore ).getCurrentPostType();

		return registry
			.select( coreDataStore )
			.getEditedEntityRecord( 'postType', postType, context.postId )
			.meta?.[ args.key ];
	},
	setValue( { registry, context, args, value } ) {
		const postType = context.postType
			? context.postType
			: registry.select( editorStore ).getCurrentPostType();
		registry
			.dispatch( coreDataStore )
			.editEntityRecord( 'postType', postType, context.postId, {
				meta: {
					[ args.key ]: value,
				},
			} );
	},
	lockAttributesEditing() {
		return ! __experimentalIsAdminUser();
	},
};
