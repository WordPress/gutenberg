/**
 * WordPress dependencies
 */
import { store as coreDataStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../store';

export default {
	name: 'core/post-meta',
	getValues( { registry, context, bindings } ) {
		const meta = registry
			.select( coreDataStore )
			.getEditedEntityRecord(
				'postType',
				context?.postType,
				context?.postId
			)?.meta;
		const newValues = {};
		for ( const [ attributeName, source ] of Object.entries( bindings ) ) {
			// Use the key if the value is not set.
			newValues[ attributeName ] =
				meta?.[ source.args.key ] ?? source.args.key;
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
		let metaFields = {};
		const {
			type,
			is_custom: isCustom,
			slug,
		} = registry.select( editorStore ).getCurrentPost();
		const { getRegisteredPostMeta, getPostTypes, getEditedEntityRecord } =
			registry.select( coreDataStore );

		// Inherit the postType from the slug if it is a template.
		if ( ! context?.postType && type === 'wp_template' ) {
			// Get the 'kind' from the start of the slug.
			// Use 'post' as the default.
			let postType = 'post';
			const isGlobalTemplate = isCustom || slug === 'index';
			if ( ! isGlobalTemplate ) {
				const [ kind ] = slug.split( '-' );
				if ( kind === 'page' ) {
					postType = 'page';
				} else if ( kind === 'single' ) {
					const postTypes =
						getPostTypes( { per_page: -1 } )?.map(
							( entity ) => entity.slug
						) || [];

					// Infer the post type from the slug.
					// TODO: Review, as it may not have a post type. http://localhost:8888/wp-admin/site-editor.php?canvas=edit
					const match = slug.match(
						`^single-(${ postTypes.join( '|' ) })(?:-.+)?$`
					);
					postType = match ? match[ 1 ] : 'post';
				}
			}
			const fields = getRegisteredPostMeta( postType );

			// Populate the `metaFields` object with the default values.
			Object.entries( fields || {} ).forEach( ( [ key, props ] ) => {
				// If the template is global, skip the fields with a subtype.
				// TODO: Add subtype to schema to be able to filter.
				if ( isGlobalTemplate && props.subtype ) {
					return;
				}
				metaFields[ key ] = props.default;
			} );
		} else {
			metaFields = getEditedEntityRecord(
				'postType',
				context?.postType,
				context?.postId
			).meta;
		}

		if ( ! metaFields || ! Object.keys( metaFields ).length ) {
			return null;
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
