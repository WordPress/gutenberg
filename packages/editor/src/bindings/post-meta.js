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
	getPlaceholder( { args } ) {
		return args.key;
	},
	// When `getValuesInBatch` is defined, this is not running.
	// Keeping it here to show the different possibilities.
	getValue( { registry, context, args } ) {
		return registry
			.select( coreDataStore )
			.getEditedEntityRecord(
				'postType',
				context?.postType,
				context?.postId
			).meta?.[ args.key ];
	},
	getValuesInBatch( { registry, context, sourceBindings } ) {
		const meta = registry
			.select( coreDataStore )
			.getEditedEntityRecord(
				'postType',
				context?.postType,
				context?.postId
			)?.meta;
		const newValues = {};
		for ( const [ attributeName, source ] of Object.entries(
			sourceBindings
		) ) {
			newValues[ attributeName ] = meta?.[ source.args.key ];
		}
		return newValues;
	},
	// When `setValuesInBatch` is defined, this is not running.
	// Keeping it here to show the different possibilities.
	setValue( { registry, context, args, value } ) {
		registry
			.dispatch( coreDataStore )
			.editEntityRecord( 'postType', context?.postType, context?.postId, {
				meta: {
					[ args.key ]: value,
				},
			} );
	},
	setValuesInBatch( { registry, context, sourceBindings } ) {
		const newMeta = {};
		Object.values( sourceBindings ).forEach( ( { args, newValue } ) => {
			newMeta[ args.key ] = newValue;
		} );
		registry
			.dispatch( coreDataStore )
			.editEntityRecord( 'postType', context?.postType, context?.postId, {
				meta: newMeta,
			} );
	},
	canUserEditValue( { select, context, args } ) {
		const postType =
			context?.postType || select( editorStore ).getCurrentPostType();

		// Check that editing is happening in the post editor and not a template.
		if ( postType === 'wp_template' ) {
			return false;
		}

		// Check that the custom field is not protected and available in the REST API.
		const isFieldExposed = !! select( coreDataStore ).getEntityRecord(
			'postType',
			postType,
			context?.postId
		)?.meta?.[ args.key ];

		if ( ! isFieldExposed ) {
			return false;
		}

		// Check that the user has the capability to edit post meta.
		const canUserEdit = select( coreDataStore ).canUserEditEntityRecord(
			'postType',
			context?.postType,
			context?.postId
		);
		if ( ! canUserEdit ) {
			return false;
		}

		return true;
	},
};
