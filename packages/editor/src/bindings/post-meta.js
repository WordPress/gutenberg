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

const { getCurrentPostId } = select( editorStore );

export default {
	name: 'core/post-meta',
	label: _x( 'Post Meta', 'block bindings source' ),
	connect( { key } ) {
		const { getEntityRecord, getEditedEntityRecord } = select( coreStore );
		const kind = 'postType';
		const name = 'post';
		const prop = 'meta';
		const id = getCurrentPostId();

		return {
			get: () => {
				const record = getEntityRecord( kind, name, id );
				const editedRecord = getEditedEntityRecord( kind, name, id );

				const fullData =
					record && editedRecord
						? {
								fullValue: record[ prop ],
								value: editedRecord[ prop ],
						  }
						: {};

				return fullData.value[ key ];
			},

			update: ( newValue ) => {
				const newMeta = {
					...getEditedEntityRecord( kind, name, id )[ prop ],
					[ key ]: newValue,
				};

				dispatch( coreStore ).editEntityRecord( kind, name, id, {
					[ prop ]: newMeta,
				} );
			},
		};
	},
	lockAttributesEditing: false,
};
