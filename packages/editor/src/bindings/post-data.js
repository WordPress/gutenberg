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
 * @param {Object} args Binding args.
 * @return {string} Field key (`field` or legacy `key`).
 */
function getPostDataFieldKey( args ) {
	if ( args?.field ) {
		return args.field;
	}
	return args?.key ?? '';
}

/**
 * @type {WPBlockBindingsSource}
 */
export default {
	name: 'core/post-data',
	getValues( { select, context, bindings, clientId } ) {
		/*
		 * BACKWARDS COMPATIBILITY: Hardcoded exception for navigation blocks.
		 * Required for WordPress 6.9+ navigation blocks. DO NOT REMOVE.
		 */
		const { getBlockAttributes, getBlockName } = select( blockEditorStore );
		const blockName = getBlockName( clientId );
		const isNavigationBlock = NAVIGATION_BLOCK_TYPES.includes( blockName );

		const { getEditedEntityRecord } = select( coreDataStore );

		/**
		 * Resolves which post record to use for a single binding. When `args.id`
		 * and `args.postType` are set (e.g. Button block entity links), those
		 * identify the post. `postType` is required in that path because the
		 * `core-data` package stores posts under ( 'postType', postTypeSlug, id );
		 * getEditedEntityRecord cannot look up a post by numeric id alone.
		 *
		 * @param {Object} binding Single attribute binding.
		 * @return {Object|undefined} Edited entity record or undefined.
		 */
		const getEntityDataValuesForBinding = ( binding ) => {
			const args = binding.args ?? {};
			let postId;
			let postType;

			if ( args.id !== undefined && args.id !== null && args.postType ) {
				postId = args.id;
				postType = args.postType;
			} else if ( isNavigationBlock ) {
				const blockAttributes = getBlockAttributes( clientId );
				postId = blockAttributes?.id;
				postType = blockAttributes?.type;
			} else {
				postId = context?.postId;
				postType = context?.postType;
			}

			return getEditedEntityRecord( 'postType', postType, postId );
		};

		const newValues = {};
		for ( const [ attributeName, binding ] of Object.entries( bindings ) ) {
			const fieldKey = getPostDataFieldKey( binding.args );
			const postDataField = postDataFields.find(
				( field ) => field.args.field === fieldKey
			);

			const entityDataValues = getEntityDataValuesForBinding( binding );

			if ( ! postDataField ) {
				// If the field is unknown, return the field name.
				newValues[ attributeName ] = fieldKey;
			} else if ( ! entityDataValues ) {
				// If the entity data does not exist, return the field label.
				newValues[ attributeName ] = postDataField.label;
			} else {
				// If the entity data exists, return the entity value.
				newValues[ attributeName ] = entityDataValues[ fieldKey ];
			}
		}
		return newValues;
	},
	setValues( { dispatch, context, bindings, clientId, select } ) {
		const { getBlockName } = select( blockEditorStore );

		const blockName = getBlockName( clientId );

		// Navigaton block types are read-only.
		// See https://github.com/WordPress/gutenberg/pull/72165.
		if ( NAVIGATION_BLOCK_TYPES.includes( blockName ) ) {
			return false;
		}
		const newData = {};
		Object.values( bindings ).forEach( ( { args, newValue } ) => {
			const field = getPostDataFieldKey( args );
			newData[ field ] = newValue;
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
		const blockName = getBlockName( clientId );

		// Navigaton block types are read-only.
		// See https://github.com/WordPress/gutenberg/pull/72165.
		if ( NAVIGATION_BLOCK_TYPES.includes( blockName ) ) {
			return false;
		}

		// Bindings that pin a specific post via args are not editable through
		// contextual post editing (setValues still targets context post only).
		if ( args?.id !== undefined && args?.id !== null ) {
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
