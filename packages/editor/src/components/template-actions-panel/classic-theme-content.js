/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	useEntityRecord,
	useEntityBlockEditor,
	store as coreStore,
} from '@wordpress/core-data';
import { BlockPreview } from '@wordpress/block-editor';
import {
	PanelBody,
	Button,
	__experimentalText as Text,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';
import { store as noticesStore } from '@wordpress/notices';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import CreateNewTemplateModal from '../post-template/create-new-template-modal';

export default function ClassicThemeContent( { templateId } ) {
	const [ isCreateModalOpen, setIsCreateModalOpen ] = useState( false );

	const {
		onNavigateToEntityRecord,
		canCreateTemplate,
		hasGoBack,
		getEditorSettings,
	} = useSelect( ( select ) => {
		const { getEditorSettings: _getEditorSettings } = select( editorStore );
		const editorSettings = _getEditorSettings();
		return {
			onNavigateToEntityRecord: editorSettings.onNavigateToEntityRecord,
			canCreateTemplate:
				!! select( coreStore ).canUser( 'create', {
					kind: 'postType',
					name: 'wp_template',
				} ) && editorSettings.supportsTemplateMode,
			hasGoBack: editorSettings.hasOwnProperty(
				'onNavigateToPreviousEntityRecord'
			),
			getEditorSettings: _getEditorSettings,
		};
	}, [] );

	const { get: getPreference } = useSelect( preferencesStore );
	const { createSuccessNotice } = useDispatch( noticesStore );

	const { editedRecord: template } = useEntityRecord(
		'postType',
		'wp_template',
		templateId
	);

	const [ blocks ] = useEntityBlockEditor( 'postType', 'wp_template', {
		id: templateId,
	} );

	// Path A: No block template and cannot create templates.
	if ( ! templateId && ! canCreateTemplate ) {
		return null;
	}

	// Path B: No block template but can create templates.
	if ( ! templateId ) {
		return (
			<>
				<PanelBody title={ __( 'Template' ) } initialOpen={ false }>
					<VStack>
						<Text>
							{ __(
								'This page uses a classic template. To edit this template with blocks, create a block template.'
							) }
						</Text>
						<HStack>
							<Button
								className="editor-template-actions-panel__action"
								__next40pxDefaultSize
								variant="secondary"
								onClick={ () => setIsCreateModalOpen( true ) }
							>
								{ __( 'Create block template' ) }
							</Button>
						</HStack>
					</VStack>
				</PanelBody>
				{ isCreateModalOpen && (
					<CreateNewTemplateModal
						onClose={ () => setIsCreateModalOpen( false ) }
					/>
				) }
			</>
		);
	}

	if ( ! template ) {
		return null;
	}

	const notificationAction = hasGoBack
		? [
				{
					label: __( 'Go back' ),
					onClick: () =>
						getEditorSettings().onNavigateToPreviousEntityRecord(),
				},
		  ]
		: undefined;

	const mayShowTemplateEditNotice = () => {
		if ( ! getPreference( 'core/edit-site', 'welcomeGuideTemplate' ) ) {
			createSuccessNotice(
				__(
					'Editing template. Changes made here affect all posts and pages that use the template.'
				),
				{ type: 'snackbar', actions: notificationAction }
			);
		}
	};

	const templateName = decodeEntities( template.title );

	const previewContent = !! blocks?.length && (
		<BlockPreview.Async>
			<BlockPreview blocks={ blocks } />
		</BlockPreview.Async>
	);

	return (
		<>
			<PanelBody
				title={ sprintf(
					/* translators: %s: template name */
					__( 'Template: %s' ),
					templateName
				) }
				initialOpen={ false }
			>
				<VStack>
					{ previewContent && (
						<div className="editor-template-actions-panel__preview">
							{ previewContent }
						</div>
					) }
					<HStack>
						{ onNavigateToEntityRecord && (
							<Button
								className="editor-template-actions-panel__action"
								__next40pxDefaultSize
								variant="secondary"
								onClick={ () => {
									onNavigateToEntityRecord( {
										postId: template.id,
										postType: 'wp_template',
									} );
									mayShowTemplateEditNotice();
								} }
							>
								{ __( 'Edit' ) }
							</Button>
						) }
						{ canCreateTemplate && (
							<Button
								className="editor-template-actions-panel__action"
								__next40pxDefaultSize
								variant="secondary"
								onClick={ () => setIsCreateModalOpen( true ) }
							>
								{ __( 'Create new' ) }
							</Button>
						) }
					</HStack>
				</VStack>
			</PanelBody>
			{ isCreateModalOpen && (
				<CreateNewTemplateModal
					onClose={ () => setIsCreateModalOpen( false ) }
				/>
			) }
		</>
	);
}
