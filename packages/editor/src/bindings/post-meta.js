/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { select, dispatch } from '@wordpress/data';
import { _x } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { store as editorStore } from '../store';

export default {
	name: 'core/post-meta',
	label: _x( 'Post Meta', 'block bindings source' ),
	connect( { key, id } ) {
		const { getEditedEntityRecord } = select( coreStore );
		const { editEntityRecord } = dispatch( coreStore );
		const { getCurrentPostId } = select( editorStore );

		id = id || getCurrentPostId();

		return {
			get: () =>
				getEditedEntityRecord( 'postType', 'post', id ).meta[ key ],

			update: ( value ) => {
				editEntityRecord( 'postType', 'post', id, {
					meta: {
						...getEditedEntityRecord( 'postType', 'post', id ).meta,
						[ key ]: value,
					},
				} );
			},
		};
	},
	lockAttributesEditing: false,
};
