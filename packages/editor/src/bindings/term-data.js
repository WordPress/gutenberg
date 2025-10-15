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
 * Creates the data fields object with the given term data values and ID value.
 *
 * @param {Object}        termDataValues The term data values.
 * @param {string|number} idValue        The ID value to use.
 * @return {Object} The data fields object.
 */
function createDataFields( termDataValues, idValue ) {
	return {
		id: {
			label: __( 'Term ID' ),
			value: idValue,
			type: 'string',
		},
		name: {
			label: __( 'Name' ),
			value: termDataValues?.name,
			type: 'string',
		},
		slug: {
			label: __( 'Slug' ),
			value: termDataValues?.slug,
			type: 'string',
		},
		link: {
			label: __( 'Link' ),
			value: termDataValues?.link,
			type: 'string',
		},
		description: {
			label: __( 'Description' ),
			value: termDataValues?.description,
			type: 'string',
		},
		parent: {
			label: __( 'Parent ID' ),
			value: termDataValues?.parent,
			type: 'string',
		},
		count: {
			label: __( 'Count' ),
			value: `(${ termDataValues?.count ?? 0 })`,
			type: 'string',
		},
	};
}

/**
 * Gets a list of term data fields with their values and labels
 * to be consumed in the needed callbacks.
 * If the value is not available based on context, like in templates,
 * it falls back to the default value, label, or key.
 *
 * @param {Object} select   The select function from the data store.
 * @param {Object} context  The context provided.
 * @param {string} clientId The block client ID used to read attributes.
 * @return {Object} List of term data fields with their value and label.
 *
 * @example
 * ```js
 * {
 *     name: {
 *         label: 'Term Name',
 *         value: 'Category Name',
 *     },
 *     count: {
 *         label: 'Term Count',
 *         value: 5,
 *     },
 *     ...
 * }
 * ```
 */
function getTermDataFields( select, context, clientId ) {
	const { getEntityRecord } = select( coreDataStore );
	const { getBlockAttributes, getBlockName } = select( blockEditorStore );

	let termDataValues, dataFields;

	/*
	 * BACKWARDS COMPATIBILITY: Hardcoded exception for navigation blocks.
	 * Required for WordPress 6.9+ navigation blocks. DO NOT REMOVE.
	 */
	const blockName = getBlockName?.( clientId );
	const isNavigationBlock = NAVIGATION_BLOCK_TYPES.includes( blockName );

	let termId, taxonomy;

	if ( isNavigationBlock ) {
		// Navigation blocks: read from block attributes
		const blockAttributes = getBlockAttributes?.( clientId );
		termId = blockAttributes?.id;
		const typeFromAttributes = blockAttributes?.type;
		taxonomy =
			typeFromAttributes === 'tag' ? 'post_tag' : typeFromAttributes;
	} else {
		// All other blocks: use context
		termId = context?.termId;
		taxonomy = context?.taxonomy;
	}

	if ( taxonomy && termId ) {
		termDataValues = getEntityRecord( 'taxonomy', taxonomy, termId );

		if ( ! termDataValues && context?.termData ) {
			termDataValues = context.termData;
		}

		if ( termDataValues ) {
			dataFields = createDataFields( termDataValues, termId );
		}
	} else if ( context?.termData ) {
		termDataValues = context.termData;
		dataFields = createDataFields(
			termDataValues,
			termDataValues?.term_id
		);
	}

	if ( ! dataFields || ! Object.keys( dataFields ).length ) {
		return null;
	}

	return dataFields;
}

/**
 * @type {WPBlockBindingsSource}
 */
export default {
	name: 'core/term-data',
	usesContext: [ 'taxonomy', 'termId', 'termData' ],
	getValues( { select, context, bindings, clientId } ) {
		const dataFields = getTermDataFields( select, context, clientId );

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
	// eslint-disable-next-line no-unused-vars
	setValues( { dispatch, context, bindings } ) {
		// Terms are typically not editable through block bindings in most contexts.
		return false;
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

		// Terms are typically read-only when displayed.
		if ( context?.termQuery ) {
			return false;
		}

		// Lock editing when `taxonomy` or `termId` is not defined.
		if ( ! context?.taxonomy || ! context?.termId ) {
			return false;
		}

		const fieldValue = getTermDataFields( select, context, undefined )?.[
			args.key
		]?.value;
		// Empty string or `false` could be a valid value, so we need to check if the field value is undefined.
		if ( fieldValue === undefined ) {
			return false;
		}

		return false;
	},
	getFieldsList( { select, context } ) {
		// Deprecated, will be removed after 6.9.
		return getTermDataFields( select, context );
	},
	editorUI( { select, context } ) {
		const selectedBlock = select( blockEditorStore ).getSelectedBlock();
		// Exit early for navigation blocks (read-only)
		if ( NAVIGATION_BLOCK_TYPES.includes( selectedBlock?.name ) ) {
			return {};
		}
		const termDataFields = Object.entries(
			getTermDataFields( select, context ) || {}
		).map( ( [ key, field ] ) => ( {
			label: field.label,
			type: field.type,
			args: {
				key,
			},
		} ) );
		/*
		 * We need to define the data as [{ label: string, value: any, type: https://developer.wordpress.org/block-editor/reference-guides/block-api/block-attributes/#type-validation }]
		 */
		return {
			mode: 'dropdown',
			data: termDataFields,
		};
	},
};
