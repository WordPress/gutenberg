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
 * @param {Object} select  The select function from the data store.
 * @param {Object} context The context provided.
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
function getPostMetaFields( select, context ) {
	const { getRegisteredPostMeta } = unlock( select( coreDataStore ) );

	const registeredFields = getRegisteredPostMeta( context?.postType );
	const metaFields = [];
	Object.entries( registeredFields ).forEach( ( [ key, props ] ) => {
		// Don't include footnotes or private fields.
		if ( key === 'footnotes' || key.charAt( 0 ) === '_' ) {
			return;
		}

		metaFields.push( {
			label: props.title || key,
			args: { key },
			default: props.default,
			type: props.type,
		} );
	} );

	return metaFields;
}

function getValue( { select, context, args } ) {
	const metaFields = getPostMetaFields( select, context );
	const metaField = metaFields.find(
		( field ) => field.args.key === args.key
	);

	// If the meta field was not found, it's either protected, inaccessible, or simply doesn't exist.
	if ( ! metaField ) {
		return args.key;
	}

	// Without a postId, we cannot look up a meta value.
	if ( ! context?.postId ) {
		// Return the default value for the meta field if available.
		return metaField.default || metaField.label || args.key;
	}

	const { getEditedEntityRecord } = select( coreDataStore );
	const entityMetaValues = getEditedEntityRecord(
		'postType',
		context?.postType,
		context?.postId
	).meta;

	return entityMetaValues?.[ args.key ] ?? metaField?.label ?? args.key;
}

/**
 * @type {WPBlockBindingsSource}
 */
export default {
	name: 'core/post-meta',
	getValues( { select, context, bindings } ) {
		const newValues = {};
		for ( const [ attributeName, binding ] of Object.entries( bindings ) ) {
			newValues[ attributeName ] = getValue( {
				select,
				context,
				args: binding.args,
			} );
		}
		return newValues;
	},
	setValues( { dispatch, context, bindings } ) {
		const newMeta = {};
		Object.values( bindings ).forEach( ( { args, newValue } ) => {
			newMeta[ args.key ] = newValue;
		} );

		dispatch( coreDataStore ).editEntityRecord(
			'postType',
			context?.postType,
			context?.postId,
			{
				meta: newMeta,
			}
		);
	},
	canUserEditValue( { select, context, args } ) {
		// Lock editing in query loop.
		if ( context?.query || context?.queryId ) {
			return false;
		}

		// Lock editing when `postType` is not defined.
		if ( ! context?.postType ) {
			return false;
		}

		const metaFields = getPostMetaFields( select, context );
		const hasMatchingMetaField = metaFields.some(
			( field ) => field.args.key === args.key
		);
		if ( ! hasMatchingMetaField ) {
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
	getFieldsList( { select, context } ) {
		const metaFields = getPostMetaFields( select, context );
		// Remove 'default' property from meta fields.
		return metaFields.map(
			( { default: defaultProp, ...otherProps } ) => ( {
				...otherProps,
			} )
		);
	},
};
