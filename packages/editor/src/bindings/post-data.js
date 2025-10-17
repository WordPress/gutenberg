/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { store as coreDataStore } from '@wordpress/core-data';

/**
 * Retrieves post data fields with their values and labels.
 * Falls back to defaults if context is missing.
 *
 * @param {Function} select  The select function from the data store.
 * @param {Object} context   The block context.
 * @return {Object|null}     List of post data fields with value and label.
 */
function getPostDataFields( select, context ) {
	const { getEditedEntityRecord } = select( coreDataStore );

	if ( !context?.postType || !context?.postId ) {
		return null;
	}

	const entityDataValues = getEditedEntityRecord(
		'postType',
		context.postType,
		context.postId
	) || {};

	return {
		title: {
			label: __( 'Post Title' ),
			value: entityDataValues?.title ?? '',
			type: 'string',
		},
		status: {
			label: __( 'Post Status' ),
			value: entityDataValues?.status ?? '',
			type: 'string',
		},
		date: {
			label: __( 'Post Date' ),
			value: entityDataValues?.date ?? '',
			type: 'string',
		},
		modified: {
			label: __( 'Post Modified Date' ),
			value: entityDataValues?.modified ?? '',
			type: 'string',
		},
	};
}

/**
 * @type {WPBlockBindingsSource}
 */
export default {
	name: 'core/post-data',

	getValues( { select, context, bindings } ) {
		const dataFields = getPostDataFields( select, context );
		if ( !dataFields ) return {};

		return Object.fromEntries(
			Object.entries( bindings ).map( ( [ attributeName, source ] ) => {
				const fieldKey = source.args.key ?? source.args.linkKey;
				const { value: fieldValue, label: fieldLabel } = dataFields[fieldKey] || {};
				return [ attributeName, fieldValue ?? fieldLabel ?? fieldKey ];
			} )
		);
	},

	setValues( { dispatch, context, bindings } ) {
		if ( !context?.postType || !context?.postId ) return;

		const newData = Object.values( bindings ).reduce( ( acc, { args, newValue } ) => {
			const fieldKey = args.key ?? args.linkKey;
			acc[fieldKey] = newValue;
			return acc;
		}, {} );

		dispatch( coreDataStore ).editEntityRecord(
			'postType',
			context.postType,
			context.postId,
			newData
		);
	},

	canUserEditValue( { select, context, args } ) {
		if ( context?.query || context?.queryId || !context?.postType ) {
			return false;
		}

		const fieldKey = args.key ?? args.linkKey;
		const fieldValue = getPostDataFields( select, context )?.[ fieldKey ]?.value;
		if ( fieldValue === undefined ) return false;

		const canUserEdit = select( coreDataStore ).canUser( 'update', {
			kind: 'postType',
			name: context.postType,
			id: context.postId,
		} );

		return !!canUserEdit;
	},

	getFieldsList( { select, context } ) {
		// Deprecated, will be removed after 6.9.
		return getPostDataFields( select, context );
	},
	editorUI( { select, context } ) {
		const selectedBlock = select( 'core/block-editor' ).getSelectedBlock();
		if ( selectedBlock?.name !== 'core/post-date' ) {
			return {};
		}
		const postDataFields = Object.entries(
			getPostDataFields( select, context ) || {}
		).map( ( [ key, field ] ) => ( {
			label: field.label,
			args: {
				key,
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
