/**
 * WordPress dependencies
 */
import { store as coreDataStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../store';
import { unlock } from '../lock-unlock';

/**
 * Gets a list of post meta fields with their values and labels
 * to be consumed in the needed callbacks.
 * If the value is not available based on context, like in templates,
 * it falls back to the default value, label, or key.
 *
 * @param {Object} registry The registry context exposed through `useRegistry`.
 * @param {Object} context  The context provided.
 * @return {Object} List of post meta fields with their value and label.
 *
 * @example
 * ```js
 * {
 *     field_1_key: {
 *         label: 'Field 1 Label',
 *         value: 'Field 1 Value',
 *     },
 *     field_2_key: {
 *         label: 'Field 2 Label',
 *         value: 'Field 2 Value',
 *     },
 *     ...
 * }
 * ```
 */
function getPostMetaFields( registry, context ) {
	const { getEditedEntityRecord } = registry.select( coreDataStore );
	const { getRegisteredPostMeta } = unlock(
		registry.select( coreDataStore )
	);

	let entityMetaValues;
	// Try to get the current entity meta values.
	if ( context?.postType && context?.postId ) {
		entityMetaValues = getEditedEntityRecord(
			'postType',
			context?.postType,
			context?.postId
		).meta;
	}

	const registeredFields = getRegisteredPostMeta( context?.postType );
	const metaFields = {};
	Object.entries( registeredFields || {} ).forEach( ( [ key, props ] ) => {
		// Don't include footnotes or private fields.
		if ( key !== 'footnotes' && key.charAt( 0 ) !== '_' ) {
			metaFields[ key ] = {
				label: props.title || key,
				value:
					// When using the entity value, an empty string IS a valid value.
					entityMetaValues?.[ key ] ??
					// When using the default, an empty string IS NOT a valid value.
					( props.default || undefined ),
			};
		}
	} );

	if ( ! Object.keys( metaFields || {} ).length ) {
		return null;
	}

	return metaFields;
}

export default {
	name: 'core/post-meta',
	getValues( { registry, context, bindings } ) {
		const metaFields = getPostMetaFields( registry, context );

		const newValues = {};
		for ( const [ attributeName, source ] of Object.entries( bindings ) ) {
			// Use the value, the field label, or the field key.
			const fieldKey = source.args.key;
			const { value: fieldValue, label: fieldLabel } =
				metaFields?.[ fieldKey ] || {};
			newValues[ attributeName ] = fieldValue ?? fieldLabel ?? fieldKey;
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
		return getPostMetaFields( registry, context );
	},
};
