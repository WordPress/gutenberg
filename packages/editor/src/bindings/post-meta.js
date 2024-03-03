/**
 * WordPress dependencies
 */
import { useEntityProp, store as coreStore } from '@wordpress/core-data';
import { select, useSelect, dispatch } from '@wordpress/data';
import { _x } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { store as editorStore } from '../store';

export default {
	name: 'core/post-meta',
	label: _x( 'Post Meta', 'block bindings source' ),
	useSource( props, sourceAttributes ) {
		const { getCurrentPostType } = useSelect( editorStore );
		const { context } = props;
		const { key: metaKey } = sourceAttributes;
		const postType = context.postType
			? context.postType
			: getCurrentPostType();

		const [ meta, setMeta ] = useEntityProp(
			'postType',
			context.postType,
			'meta',
			context.postId
		);

		if ( postType === 'wp_template' ) {
			return { placeholder: metaKey };
		}
		const metaValue = meta[ metaKey ];
		const updateMetaValue = ( newValue ) => {
			setMeta( { ...meta, [ metaKey ]: newValue } );
		};

		return {
			placeholder: metaKey,
			value: metaValue,
			updateValue: updateMetaValue,
		};
	},

	helper( props, sourceAttributes ) {
		const { getCurrentPostType, getCurrentPostId } = select( editorStore );
		const { context } = props;
		const { key: metaKey } = sourceAttributes;

		const kind = 'postType';
		const postType = context.postType ?? getCurrentPostType();
		const postId = context.postId ?? getCurrentPostId();
		const prop = 'meta';

		const { getEntityRecord, getEditedEntityRecord } = select( coreStore );

		const record = getEntityRecord( kind, postType, postId );
		const editedRecord = getEditedEntityRecord( kind, postType, postId );

		return {
			get() {
				const propValue =
					record && editedRecord
						? {
								value: editedRecord[ prop ]?.[ metaKey ],
								fullValue: record[ prop ]?.[ metaKey ],
						  }
						: {};

				return propValue.value;
			},

			update( newValue ) {
				const { editEntityRecord } = dispatch( coreStore );

				editEntityRecord( kind, postType, postId, {
					meta: {
						...record[ prop ],
						[ metaKey ]: newValue,
					},
				} );
			},
		};
	},

	lockAttributesEditing: false,
};
