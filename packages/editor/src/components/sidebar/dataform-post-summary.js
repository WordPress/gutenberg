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
import { usePostTemplatePanelMode } from '../post-template/hooks';

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
			id: 'post-content-info',
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
		'date',
		'slug',
		'author',
		'template',
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
		'parent',
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

	const templatePanelMode = usePostTemplatePanelMode();

	const availableTemplates = useSelect( ( select ) => {
		if ( select( coreDataStore ).getCurrentTheme()?.is_block_theme ) {
			return null;
		}
		return (
			select( editorStore ).getEditorSettings().availableTemplates ?? {}
		);
	}, [] );

	// Augment record only when needed(not a block theme with available templates).
	const augmentedRecord = useMemo( () => {
		if ( ! record || ! availableTemplates ) {
			return record;
		}
		return {
			...record,
			available_templates: availableTemplates,
		};
	}, [ record, availableTemplates ] );

	const { editEntityRecord } = useDispatch( coreDataStore );

	const _fields = usePostFields( { postType } );
	const fields = useMemo(
		() =>
			_fields
				?.map( ( field ) => {
					if ( field.id === 'status' ) {
						return {
							...field,
							elements: field.elements.filter(
								( element ) => element.value !== 'trash'
							),
						};
					}
					if ( field.id === 'template' ) {
						// `usePostTemplatePanelMode` is reused in the Post Template panel to match
						// the existing behavior. If the panel rendered nothing we should exclude the
						// template field from the form.
						if ( ! templatePanelMode ) {
							return null;
						}
						// In classic themes without available templates we need to make the field read-only.
						if (
							templatePanelMode === 'classic' &&
							Object.keys( availableTemplates ?? {} ).length === 0
						) {
							return {
								...field,
								readOnly: true,
								render: () => __( 'Default template' ),
							};
						}
						return field;
					}
					return field;
				} )
				.filter( Boolean ),
		[ _fields, templatePanelMode, availableTemplates ]
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
					data={ augmentedRecord }
					fields={ fields }
					form={ form }
					onChange={ onChange }
				/>
				<PostTrash onActionPerformed={ onActionPerformed } />
			</VStack>
		</PostPanelSection>
	);
}
