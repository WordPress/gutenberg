/**
 * WordPress dependencies
 */
import { store as coreDataStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../store';
import { unlock } from '../lock-unlock';

function getMetadata( registry, context ) {
	let metaFields = {};
	const { type } = registry.select( editorStore ).getCurrentPost();
	const { getEditedEntityRecord } = registry.select( coreDataStore );
	const { getRegisteredPostMeta } = unlock(
		registry.select( coreDataStore )
	);

	if ( type === 'wp_template' ) {
		const fields = getRegisteredPostMeta( context?.postType );
		// Populate the `metaFields` object with the default values.
		Object.entries( fields || {} ).forEach( ( [ key, props ] ) => {
			metaFields[ key ] = props.default;
		} );
	} else {
		metaFields = getEditedEntityRecord(
			'postType',
			context?.postType,
			context?.postId
		).meta;
	}

	return metaFields;
}

export default {
	name: 'core/post-meta',
	getValues( { registry, context, bindings } ) {
		const metaFields = getMetadata( registry, context );

		const newValues = {};
		for ( const [ attributeName, source ] of Object.entries( bindings ) ) {
			// Use the key if the value is not set.
			newValues[ attributeName ] =
				metaFields?.[ source.args.key ] ?? source.args.key;
		}
		return newValues;
	},
	setValues( { registry, context, bindings } ) {
		const newMeta = {};
		Object.values( bindings ).forEach( ( { args, newValue } ) => {
			newMeta[ args.key ] = newValue;
		} );
		registry
			.dispatch( coreDataStore )
			.editEntityRecord( 'postType', context?.postType, context?.postId, {
				meta: newMeta,
			} );
	},
	canUserEditValue( { select, context, args } ) {
		// Lock editing in query loop.
		if ( context?.query || context?.queryId ) {
			return false;
		}

		const postType =
			context?.postType || select( editorStore ).getCurrentPostType();

		// Check that editing is happening in the post editor and not a template.
		if ( postType === 'wp_template' ) {
			return false;
		}

		// Check that the custom field is not protected and available in the REST API.
		// Empty string or `false` could be a valid value, so we need to check if the field value is undefined.
		const fieldValue = select( coreDataStore ).getEntityRecord(
			'postType',
			postType,
			context?.postId
		)?.meta?.[ args.key ];

		if ( fieldValue === undefined ) {
			return false;
		}
		// Check that custom fields metabox is not enabled.
		const areCustomFieldsEnabled =
			select( editorStore ).getEditorSettings().enableCustomFields;
		if ( areCustomFieldsEnabled ) {
			return false;
		}

		// Check that the user has the capability to edit post meta.
		const canUserEdit = select( coreDataStore ).canUser( 'update', {
			kind: 'postType',
			name: context?.postType,
			id: context?.postId,
		} );
		if ( ! canUserEdit ) {
			return false;
		}

		return true;
	},
	getFieldsList( { registry, context } ) {
		const metaFields = getMetadata( registry, context );

		// TODO: Fields returns undefined on the first click.
		const fields = registry
			.select( coreDataStore )
			// TODO: Last item 'post' should not be hardcoded.
			.getEntityRecord( 'root', 'postType', 'post' );

		if ( ! metaFields || ! Object.keys( metaFields ).length ) {
			if ( ! fields?.meta ) {
				return null;
			}
			const metaDefaults = {};
			for ( const key in fields.meta ) {
				if ( fields.meta.hasOwnProperty( key ) ) {
					metaDefaults[ key ] = fields.meta[ key ].default;
				}
			}
			return metaDefaults;
		}

		// Remove footnotes or private keys from the list of fields.
		// TODO: Remove this once we retrieve the fields from 'types' endpoint in post or page editor.
		return Object.fromEntries(
			Object.entries( metaFields ).filter(
				( [ key ] ) => key !== 'footnotes' && key.charAt( 0 ) !== '_'
			)
		);
	},
};
