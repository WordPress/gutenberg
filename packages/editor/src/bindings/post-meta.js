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
	getPlaceholder( { args } ) {
		return args.key;
	},
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
			newValues[ attributeName ] = meta?.[ source.args.key ];
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
		const isFieldExposed = !! select( coreDataStore ).getEntityRecord(
			'postType',
			postType,
			context?.postId
		)?.meta?.[ args.key ];

		if ( ! isFieldExposed ) {
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
		const metaFields = registry
			.select( coreDataStore )
			.getEditedEntityRecord(
				'postType',
				context?.postType,
				context?.postId
			).meta;

		if ( ! metaFields || ! Object.keys( metaFields ).length ) {
			return null;
		}

		// Remove footnotes from the list of fields
		return Object.fromEntries(
			Object.entries( metaFields ).filter(
				( [ key ] ) => key !== 'footnotes'
			)
		);
	},
};
