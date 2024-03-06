/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';

import { select } from '@wordpress/data';
import { _x } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { store as editorStore } from '../store';

const { getCurrentPostId } = select( editorStore );

export default {
	name: 'core/post-meta',
	label: _x( 'Post Meta', 'block bindings source' ),
	get( blockProps, { key } ) {
		const { getEntityRecord, getEditedEntityRecord } = select( coreStore );
		const kind = 'postType';
		const name = 'post';
		const prop = 'meta';
		const id = getCurrentPostId();

		const record = getEntityRecord( kind, name, id ); // Trigger resolver.
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
};
