/**
 * WordPress dependencies
 */
import { useEntityProp, store as coreStore } from '@wordpress/core-data';
import { select, dispatch } from '@wordpress/data';
import { _x } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { store as editorStore } from '../store';

export default {
	name: 'core/post-meta',
	label: _x( 'Post Meta', 'block bindings source' ),
	init( props, sourceAttributes ) {
		const { getCurrentPostType, getCurrentPostId } = select( editorStore );
		const { context } = props;
		const { key: metaKey } = sourceAttributes;

		const kind = 'postType';
		const postType = context.postType ?? getCurrentPostType();
		const id = context.postId ?? getCurrentPostId();

		const { getEntityRecord, getEditedEntityRecord } = select( coreStore );

		const record = getEntityRecord( kind, postType, id );
		const editedRecord = getEditedEntityRecord( kind, postType, id );

		return {
			value: editedRecord.meta?.[ metaKey ],

			placeholder: metaKey,

			update( newValue ) {
				const { editEntityRecord } = dispatch( coreStore );

				editEntityRecord( kind, postType, id, {
					meta: {
						...record.meta,
						[ metaKey ]: newValue,
					},
				} );
			},

			useSource() {
				const [ meta ] = useEntityProp( kind, postType, 'meta', id );

				if ( postType === 'wp_template' ) {
					return { placeholder: metaKey };
				}

				return meta[ metaKey ];
			},
		};
	},

	lockAttributesEditing: false,
};
