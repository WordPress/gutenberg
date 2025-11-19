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

const termDataFields = [
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
		args: { field: 'count' }, // TODO: Fallback to zero
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
		const allowedFields = termDataFields.map(
			( field ) => field.args.field
		);

		/*
		 * BACKWARDS COMPATIBILITY: Hardcoded exception for navigation blocks.
		 * Required for WordPress 6.9+ navigation blocks. DO NOT REMOVE.
		 */
		const { getBlockAttributes, getBlockName } = select( blockEditorStore );
		const blockName = getBlockName?.( clientId );
		const isNavigationBlock = NAVIGATION_BLOCK_TYPES.includes( blockName );

		let termId, taxonomy, termDataValues;

		if ( isNavigationBlock ) {
			// Navigation blocks: read from block attributes
			const blockAttributes = getBlockAttributes?.( clientId );
			termId = blockAttributes?.id;
			const typeFromAttributes = blockAttributes?.type;
			taxonomy =
				typeFromAttributes === 'tag' ? 'post_tag' : typeFromAttributes;
		} else if ( context.termId && context.taxonomy ) {
			// All other blocks: use context
			termId = context.termId;
			taxonomy = context.taxonomy;
		} else if ( context.termData ) {
			// Fallback to context termData if available
			termId = context.termData.term_id;
			taxonomy = context.termData.taxonomy;

			termDataValues = context.termData; // TODO: Match field names. term_id -> id
		}

		if ( taxonomy && termId && ! termDataValues ) {
			const { getEntityRecord } = select( coreDataStore );
			termDataValues = getEntityRecord( 'taxonomy', taxonomy, termId );

			if ( ! termDataValues && context?.termData ) {
				termDataValues = context.termData;
			}
		}

		const newValues = {};
		for ( const [ attributeName, binding ] of Object.entries( bindings ) ) {
			if ( ! allowedFields.includes( binding.args.field ) ) {
				newValues[ attributeName ] = binding.args.field;
				continue;
			}

			newValues[ attributeName ] =
				termDataValues?.[ binding.args.field ] ??
				termDataFields.find(
					( field ) => field.args.field === binding.args.field
				).label;
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

		return false;
	},
	getFieldsList() {
		return termDataFields;
	},
};
