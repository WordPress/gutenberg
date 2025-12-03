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

export const termDataFields = [
	{
		label: __( 'Term ID' ),
		args: { field: 'id' },
		type: 'string',
	},
	{
		label: __( 'Name' ),
		args: { field: 'name' },
		type: 'string',
	},
	{
		label: __( 'Slug' ),
		args: { field: 'slug' },
		type: 'string',
	},
	{
		label: __( 'Link' ),
		args: { field: 'link' },
		type: 'string',
	},
	{
		label: __( 'Description' ),
		args: { field: 'description' },
		type: 'string',
	},
	{
		label: __( 'Parent ID' ),
		args: { field: 'parent' },
		type: 'string',
	},
	{
		label: __( 'Count' ),
		args: { field: 'count' },
		type: 'string',
	},
];

/**
 * @type {WPBlockBindingsSource}
 */
export default {
	name: 'core/term-data',
	usesContext: [ 'taxonomy', 'termId', 'termData' ],
	getValues( { select, context, bindings, clientId } ) {
		const { getEntityRecord } = select( coreDataStore );

		/*
		 * BACKWARDS COMPATIBILITY: Hardcoded exception for navigation blocks.
		 * Required for WordPress 6.9+ navigation blocks. DO NOT REMOVE.
		 */
		const { getBlockAttributes, getBlockName } = select( blockEditorStore );
		const blockName = getBlockName( clientId );
		const isNavigationBlock = NAVIGATION_BLOCK_TYPES.includes( blockName );

		let termDataValues;

		if ( isNavigationBlock ) {
			// Navigation blocks: read from block attributes
			const blockAttributes = getBlockAttributes( clientId );
			const typeFromAttributes = blockAttributes?.type;
			const taxonomy =
				typeFromAttributes === 'tag' ? 'post_tag' : typeFromAttributes;
			termDataValues = getEntityRecord(
				'taxonomy',
				taxonomy,
				blockAttributes?.id
			);
		} else if ( context.termId && context.taxonomy ) {
			// All other blocks: use context
			termDataValues = getEntityRecord(
				'taxonomy',
				context.taxonomy,
				context.termId
			);
		}

		// Fall back to context termData if available.
		if ( ! termDataValues && context?.termData && ! isNavigationBlock ) {
			termDataValues = context.termData;
		}

		const newValues = {};
		for ( const [ attributeName, binding ] of Object.entries( bindings ) ) {
			const termDataField = termDataFields.find(
				( field ) => field.args.field === binding.args.field
			);

			if ( ! termDataField ) {
				// If the field is unknown, return the field name.
				newValues[ attributeName ] = binding.args.field;
			} else if (
				! termDataValues ||
				termDataValues[ binding.args.field ] === undefined
			) {
				// If the term data does not exist, return the field label.
				newValues[ attributeName ] = termDataField.label;
			} else if ( binding.args.field === 'count' ) {
				// Return the term count value in parentheses.
				newValues[ attributeName ] =
					'(' + termDataValues[ binding.args.field ] + ')';
			} else {
				// If the term data exists, return the term data value.
				newValues[ attributeName ] =
					termDataValues[ binding.args.field ];
			}
		}
		return newValues;
	},
	// eslint-disable-next-line no-unused-vars
	setValues( { dispatch, context, bindings } ) {
		// Terms are typically not editable through block bindings in most contexts.
		return false;
	},
	canUserEditValue( { select, context } ) {
		const { getBlockName, getSelectedBlockClientId } =
			select( blockEditorStore );

		const clientId = getSelectedBlockClientId();
		const blockName = getBlockName( clientId );

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

		return false;
	},
	getFieldsList( { context, select } ) {
		const { getBlockAttributes, getBlockName, getSelectedBlockClientId } =
			select( blockEditorStore );
		const clientId = getSelectedBlockClientId();
		const blockName = getBlockName( clientId );

		if ( NAVIGATION_BLOCK_TYPES.includes( blockName ) ) {
			// Navigation blocks: read from block attributes
			const blockAttributes = getBlockAttributes( clientId );
			if (
				! blockAttributes ||
				! blockAttributes.id ||
				! blockAttributes.type
			) {
				return [];
			}
			return termDataFields;
		}

		if ( ! context ) {
			return [];
		}

		if ( ( context.taxonomy && context.termId ) || context.termData ) {
			return termDataFields;
		}

		return [];
	},
};
