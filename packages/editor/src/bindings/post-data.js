/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { store as coreDataStore } from '@wordpress/core-data';

/**
 * Gets a list of post data fields with their values and labels
 * to be consumed in the needed callbacks.
 * If the value is not available based on context, like in templates,
 * it falls back to the default value, label, or key.
 *
 * @param {Object} select  The select function from the data store.
 * @param {Object} context The context provided.
 * @return {Object} List of post data fields with their value and label.
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
function getPostDataFields( select, context ) {
	const { getEditedEntityRecord } = select( coreDataStore );

	let entityDataValues, dataFields;
	// Try to get the current entity data values.
	if ( context?.postType && context?.postId ) {
		entityDataValues = getEditedEntityRecord(
			'postType',
			context?.postType,
			context?.postId
		);
		dataFields = {
			date: {
				label: __( 'Post Date' ),
				value: entityDataValues?.date,
				type: 'string',
			},
			modified: {
				label: __( 'Post Modified Date' ),
				value: entityDataValues?.modified,
				type: 'string',
			},
		};
	}

	if ( ! Object.keys( dataFields || {} ).length ) {
		return null;
	}

	return dataFields;
}

/**
 * @type {WPBlockBindingsSource}
 */
export default {
	name: 'core/post-data',
	getValues( { select, context, bindings } ) {
		const dataFields = getPostDataFields( select, context );

		const newValues = {};
		for ( const [ attributeName, source ] of Object.entries( bindings ) ) {
			// Use the value, the field label, or the field key.
			const fieldKey = source.args.key;
			const { value: fieldValue, label: fieldLabel } =
				dataFields?.[ fieldKey ] || {};
			newValues[ attributeName ] = fieldValue ?? fieldLabel ?? fieldKey;
		}
		return newValues;
	},
	setValues( { dispatch, context, bindings } ) {
		const newData = {};
		Object.values( bindings ).forEach( ( { args, newValue } ) => {
			newData[ args.key ] = newValue;
		} );

		dispatch( coreDataStore ).editEntityRecord(
			'postType',
			context?.postType,
			context?.postId,
			newData
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

		const fieldValue = getPostDataFields( select, context )?.[ args.key ]
			?.value;
		// Empty string or `false` could be a valid value, so we need to check if the field value is undefined.
		if ( fieldValue === undefined ) {
			return false;
		}

		// Check that the user has the capability to edit post data.
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
		return getPostDataFields( select, context );
	},
};
