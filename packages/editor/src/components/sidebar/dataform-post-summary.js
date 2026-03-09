/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';
import { DataForm } from '@wordpress/dataviews';
import { __experimentalVStack as VStack } from '@wordpress/components';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PostCardPanel from '../post-card-panel';
import PostPanelSection from '../post-panel-section';
import { store as editorStore } from '../../store';
import PostTrash from '../post-trash';
import usePostFields from '../post-fields';
import { unlock } from '../../lock-unlock';

const form = {
	layout: {
		type: 'panel',
	},
	fields: [
		{
			id: 'featured_media',
			layout: {
				type: 'regular',
				labelPosition: 'none',
			},
		},
		{
			id: 'status',
			label: __( 'Status' ),
			children: [
				{
					id: 'status',
					layout: { type: 'regular', labelPosition: 'none' },
				},
				'password',
			],
		},
		'author',
		'date',
		'slug',
		'parent',
		{
			id: 'discussion',
			label: __( 'Discussion' ),
			children: [
				{
					id: 'comment_status',
					layout: { type: 'regular', labelPosition: 'none' },
				},
				'ping_status',
			],
		},
		'template',
		'format',
	],
};

export default function DataFormPostSummary( { onActionPerformed } ) {
	const { postType, postId } = useSelect( ( select ) => {
		const { getCurrentPostType, getCurrentPostId } = unlock(
			select( editorStore )
		);
		return {
			postType: getCurrentPostType(),
			postId: getCurrentPostId(),
		};
	}, [] );

	const record = useSelect(
		( select ) => {
			if ( ! postType || ! postId ) {
				return null;
			}
			return select( coreDataStore ).getEditedEntityRecord(
				'postType',
				postType,
				postId
			);
		},
		[ postType, postId ]
	);

	const { editEntityRecord } = useDispatch( coreDataStore );

	const _fields = usePostFields( { postType } );
	const fields = useMemo(
		() =>
			_fields?.map( ( field ) => {
				if ( field.id === 'status' ) {
					return {
						...field,
						elements: field.elements.filter(
							( element ) => element.value !== 'trash'
						),
					};
				}
				return field;
			} ),
		[ _fields ]
	);

	const onChange = ( edits ) => {
		if (
			edits.status &&
			edits.status !== 'future' &&
			record?.status === 'future' &&
			new Date( record.date ) > new Date()
		) {
			edits.date = null;
		}
		if ( edits.status && edits.status === 'private' && record?.password ) {
			edits.password = '';
		}

		editEntityRecord( 'postType', postType, postId, edits );
	};

	return (
		<PostPanelSection className="editor-post-summary">
			<VStack spacing={ 4 }>
				<PostCardPanel
					postType={ postType }
					postId={ postId }
					onActionPerformed={ onActionPerformed }
				/>
				<DataForm
					data={ record }
					fields={ fields }
					form={ form }
					onChange={ onChange }
				/>
				<PostTrash onActionPerformed={ onActionPerformed } />
			</VStack>
		</PostPanelSection>
	);
}
