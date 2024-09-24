/**
 * WordPress dependencies
 */
import { store as coreDataStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../store';
import { unlock } from '../lock-unlock';

function getMetadata( registry, context, registeredFields ) {
	let metaFields = {};
	const type = registry.select( editorStore ).getCurrentPostType();
	const { getEditedEntityRecord } = registry.select( coreDataStore );

	if ( context?.postType && context?.postId ) {
		metaFields = getEditedEntityRecord(
			'postType',
			context?.postType,
			context?.postId
		).meta;
	} else if ( type === 'wp_template' ) {
		// Populate the `metaFields` object with the default values.
		Object.entries( registeredFields || {} ).forEach(
			( [ key, props ] ) => {
				if ( props.default ) {
					metaFields[ key ] = props.default;
				}
			}
		);
	}

	return metaFields;
}

export default {
	name: 'core/post-meta',
	getValues( { registry, context, bindings } ) {
		const { getRegisteredPostMeta } = unlock(
			registry.select( coreDataStore )
		);
		const registeredFields = getRegisteredPostMeta( context?.postType );
		const metaFields = getMetadata( registry, context, registeredFields );

		const newValues = {};
		for ( const [ attributeName, source ] of Object.entries( bindings ) ) {
			// Use the value, the field label, or the field key.
			const metaKey = source.args.key;
			newValues[ attributeName ] =
				metaFields?.[ metaKey ] ??
				registeredFields?.[ metaKey ]?.title ??
				metaKey;
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
		const { getRegisteredPostMeta } = unlock(
			registry.select( coreDataStore )
		);
		const registeredFields = getRegisteredPostMeta( context?.postType );
		const metaFields = getMetadata( registry, context, registeredFields );

		if ( ! metaFields || ! Object.keys( metaFields ).length ) {
			return null;
		}

		return Object.fromEntries(
			Object.entries( metaFields )
				// Remove footnotes or private keys from the list of fields.
				.filter(
					( [ key ] ) =>
						key !== 'footnotes' && key.charAt( 0 ) !== '_'
				)
				// Return object with label and value.
				.map( ( [ key, value ] ) => [
					key,
					{
						label: registeredFields?.[ key ]?.title || key,
						value,
					},
				] )
		);
	},
};
