/**
 * WordPress dependencies
 */
import { store as coreDataStore } from '@wordpress/core-data';
import { _x } from '@wordpress/i18n';

export default {
	name: 'core/post-meta',
	label: _x( 'Post Meta', 'block bindings source' ),
	getPlaceholder( { args } ) {
		return args.key;
	},
	getValue( { select, context, args } ) {
		return select( coreDataStore ).getEditedEntityRecord(
			'postType',
			context?.postType,
			context?.postId
		).meta?.[ args.key ];
	},
};
