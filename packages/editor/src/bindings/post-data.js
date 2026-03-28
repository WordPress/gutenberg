/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { store as coreDataStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';

// Block types that store entity references in their own attributes
// rather than relying on block context.
const ENTITY_ATTRIBUTE_BLOCK_TYPES = [
	'core/navigation-link',
	'core/navigation-submenu',
	'core/button',
];

// Navigation block types need special handling (read-only, use 'type' attribute).
const NAVIGATION_BLOCK_TYPES = [
	'core/navigation-link',
	'core/navigation-submenu',
];

const postDataFields = [
	{
		label: __( 'Post Date' ),
		args: { field: 'date' },
		type: 'string',
	},
	{
		label: __( 'Post Modified Date' ),
		args: { field: 'modified' },
		type: 'string',
	},
	{
		label: __( 'Post Link' ),
		args: { field: 'link' },
		type: 'string',
	},
];

/**
 * @type {WPBlockBindingsSource}
 */
export default {
	name: 'core/post-data',
	getValues( { select, context, bindings, clientId } ) {
		const { getBlockAttributes, getBlockName } = select( blockEditorStore );
		const blockName = getBlockName( clientId );
		const readsEntityFromAttributes =
			ENTITY_ATTRIBUTE_BLOCK_TYPES.includes( blockName );

		let postId, postType;

		if ( readsEntityFromAttributes ) {
			// These blocks store the entity ID in their own attributes.
			const blockAttributes = getBlockAttributes( clientId );
			postId = blockAttributes?.id;
			postType = NAVIGATION_BLOCK_TYPES.includes( blockName )
				? blockAttributes?.type
				: blockAttributes?.entityType;
		} else {
			// All other blocks: use context
			postId = context?.postId;
			postType = context?.postType;
		}

		const { getEditedEntityRecord } = select( coreDataStore );
		const entityDataValues = getEditedEntityRecord(
			'postType',
			postType,
			postId
		);

		const newValues = {};
		for ( const [ attributeName, binding ] of Object.entries( bindings ) ) {
			const postDataField = postDataFields.find(
				( field ) => field.args.field === binding.args.field
			);

			if ( ! postDataField ) {
				// If the field is unknown, return the field name.
				newValues[ attributeName ] = binding.args.field;
			} else if ( ! entityDataValues ) {
				// If the entity data does not exist, return the field label.
				newValues[ attributeName ] = postDataField.label;
			} else {
				// If the entity data exists, return the entity value.
				newValues[ attributeName ] =
					entityDataValues[ binding.args.field ];
			}
		}
		return newValues;
	},
	setValues( { dispatch, context, bindings, clientId, select } ) {
		const { getBlockName } = select( blockEditorStore );

		const blockName = getBlockName( clientId );

		// Entity-attribute blocks are read-only for URL bindings.
		if ( ENTITY_ATTRIBUTE_BLOCK_TYPES.includes( blockName ) ) {
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
	canUserEditValue( { select, context } ) {
		const { getBlockName, getSelectedBlockClientId } =
			select( blockEditorStore );
		const clientId = getSelectedBlockClientId();
		const blockName = getBlockName( clientId );

		// Entity-attribute blocks manage their bindings through their
		// own UI, not through direct value editing.
		if ( ENTITY_ATTRIBUTE_BLOCK_TYPES.includes( blockName ) ) {
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
	getFieldsList( { context, select } ) {
		const selectedBlock = select( blockEditorStore ).getSelectedBlock();
		if ( selectedBlock?.name !== 'core/post-date' ) {
			return [];
		}

		if ( ! context || ! context.postId || ! context.postType ) {
			return [];
		}

		return postDataFields;
	},
};
