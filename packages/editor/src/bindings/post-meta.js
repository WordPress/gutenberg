/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { select, subscribe } from '@wordpress/data';
import { _x } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { store as editorStore } from '../store';

const { getCurrentPostId } = select( editorStore );

export default {
	name: 'core/post-meta',
	label: _x( 'Post Meta', 'block bindings source' ),
	connect( blockProps, { key }, onPropChange = () => {} ) {
		const { getEntityRecord, getEditedEntityRecord } = select( coreStore );
		const kind = 'postType';
		const name = 'post';
		const prop = 'meta';
		const id = getCurrentPostId();

		let prevValue;

		const checkChanges = () => {
			const record = getEntityRecord( kind, name, id ); // Trigger resolver.
			const editedRecord = getEditedEntityRecord( kind, name, id );

			const fullData =
				record && editedRecord
					? {
							fullValue: record[ prop ],
							value: editedRecord[ prop ],
					  }
					: {};

			if ( fullData.value[ key ] === prevValue ) {
				return;
			}

			prevValue = fullData.value[ key ];
			onPropChange( fullData.value[ key ] );
		};

		const unsubscribe = subscribe( checkChanges );

		return {
			value: getEntityRecord( kind, name, id )?.[ prop ][ key ],
			onUnsubscribe() {
				unsubscribe();
			},
		};
	},
};
