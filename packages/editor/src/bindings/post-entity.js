/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { select, dispatch } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { store as editorStore } from '../store';
import { RichTextData } from '@wordpress/rich-text';

export default {
	name: 'core/post-entity',
	label: __( 'Post Entity' ),
	connect( { prop, id } ) {
		if ( ! prop ) {
			throw new Error( 'The "prop" argument is required.' );
		}

		const { getEditedEntityRecord } = select( coreStore );
		const { editEntityRecord } = dispatch( coreStore );
		const { getCurrentPostId } = select( editorStore );

		id = id || getCurrentPostId();

		return {
			get: () => {
				const record = getEditedEntityRecord( 'postType', 'post', id );
				return record[ prop ]?.rendered || record[ prop ];
			},

			update: ( newValue ) => {
				if ( newValue instanceof RichTextData ) {
					newValue = newValue.toString();
				}

				editEntityRecord( 'postType', 'post', id, {
					[ prop ]: newValue,
				} );
			},
		};
	},

	lockAttributesEditing: false,
};
