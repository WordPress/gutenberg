/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { store as coreDataStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';

// Navigation block types that use special handling for backwards compatibility
const NAVIGATION_BLOCK_TYPES = [
	'core/navigation-link',
	'core/navigation-submenu',
];

/**
 * Gets a list of post data fields with their values and labels
 * to be consumed in the needed callbacks.
 * If the value is not available based on context, like in templates,
 * it falls back to the default value, label, or key.
 *
 * @param {Object} select   The select function from the data store.
 * @param {Object} context  The context provided.
 * @param {string} clientId The block client ID used to read attributes.
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
function getPostDataFields( select, context, clientId ) {
	const { getEditedEntityRecord } = select( coreDataStore );
	const { getBlockAttributes, getBlockName } = select( blockEditorStore );

	let entityDataValues, dataFields;

	/*
	 * BACKWARDS COMPATIBILITY: Hardcoded exception for navigation blocks.
	 * Required for WordPress 6.9+ navigation blocks. DO NOT REMOVE.
	 */
	const blockName = getBlockName?.( clientId );
	const isNavigationBlock = NAVIGATION_BLOCK_TYPES.includes( blockName );

	let postId, postType;

	if ( isNavigationBlock ) {
		// Navigation blocks: read from block attributes
		const blockAttributes = getBlockAttributes?.( clientId );
		postId = blockAttributes?.id;
		postType = blockAttributes?.type;
	} else {
		// All other blocks: use context
		postId = context?.postId;
		postType = context?.postType;
	}

	// Try to get the current entity data values using resolved identifiers.
	if ( postType && postId ) {
		entityDataValues = getEditedEntityRecord(
			'postType',
			postType,
			postId
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
			link: {
				label: __( 'Post Link' ),
				value: entityDataValues?.link,
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
	getValues( { select, context, bindings, clientId } ) {
		const dataFields = getPostDataFields( select, context, clientId );

		const newValues = {};
		for ( const [ attributeName, source ] of Object.entries( bindings ) ) {
			// Use the value, the field label, or the field key.
			const fieldKey = source.args.field;
			const { value: fieldValue, label: fieldLabel } =
				dataFields?.[ fieldKey ] || {};
			newValues[ attributeName ] = fieldValue ?? fieldLabel ?? fieldKey;
		}
		return newValues;
	},
	setValues( { dispatch, context, bindings, clientId, select } ) {
		const { getBlockName } = select( blockEditorStore );

		const blockName = getBlockName?.( clientId );

		// Navigaton block types are read-only.
		// See https://github.com/WordPress/gutenberg/pull/72165.
		if ( NAVIGATION_BLOCK_TYPES.includes( blockName ) ) {
			return false;
		}
		const newData = {};
		Object.values( bindings ).forEach( ( { args, newValue } ) => {
			newData[ args.field ] = newValue;
		} );

		dispatch( coreDataStore ).editEntityRecord(
			'postType',
			context?.postType,
			context?.postId,
			newData
		);
	},
	canUserEditValue( { select, context, args } ) {
		const { getBlockName, getSelectedBlockClientId } =
			select( blockEditorStore );
		const clientId = getSelectedBlockClientId();
		const blockName = getBlockName?.( clientId );

		// Navigaton block types are read-only.
		// See https://github.com/WordPress/gutenberg/pull/72165.
		if ( NAVIGATION_BLOCK_TYPES.includes( blockName ) ) {
			return false;
		}

		// Lock editing in query loop.
		if ( context?.query || context?.queryId ) {
			return false;
		}

		// Lock editing when `postType` is not defined.
		if ( ! context?.postType ) {
			return false;
		}

		const fieldValue = getPostDataFields( select, context, undefined )?.[
			args.field
		]?.value;
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
		const clientId = select( blockEditorStore ).getSelectedBlockClientId();
		// Deprecated, will be removed after 6.9.
		return getPostDataFields( select, context, clientId );
	},
	editorUI( { select, context } ) {
		const selectedBlock = select( blockEditorStore ).getSelectedBlock();
		if ( selectedBlock?.name !== 'core/post-date' ) {
			return {};
		}
		// Exit early for navigation blocks (read-only)
		if ( NAVIGATION_BLOCK_TYPES.includes( selectedBlock?.name ) ) {
			return {};
		}
		const postDataFields = Object.entries(
			getPostDataFields( select, context ) || {}
		).map( ( [ key, field ] ) => ( {
			label: field.label,
			args: {
				field: key,
			},
			type: field.type,
		} ) );
		/*
		 * We need to define the data as [{ label: string, value: any, type: https://developer.wordpress.org/block-editor/reference-guides/block-api/block-attributes/#type-validation }]
		 */
		return {
			mode: 'dropdown',
			data: postDataFields,
		};
	},
};
