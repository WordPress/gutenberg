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
	Tooltip,
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
import { SwapTemplateModal } from '../post-template/swap-template-button';
import { useAvailableTemplates } from '../post-template/hooks';

export default function TemplateActionsPanelContent() {
	const templateId = useSelect(
		( select ) => select( editorStore ).getCurrentTemplateId(),
		[]
	);
	const [ isCreateModalOpen, setIsCreateModalOpen ] = useState( false );
	const [ isSwapModalOpen, setIsSwapModalOpen ] = useState( false );

	const availableTemplates = useAvailableTemplates();
	const hasSwapTargets = !! availableTemplates?.length;

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
			canCreateTemplate: !! select( coreStore ).canUser( 'create', {
				kind: 'postType',
				name: 'wp_template',
			} ),
			hasGoBack: editorSettings.hasOwnProperty(
				'onNavigateToPreviousEntityRecord'
			),
			getEditorSettings: _getEditorSettings,
		};
	}, [] );

	const { get: getPreference } = useSelect( preferencesStore );
	const { createSuccessNotice } = useDispatch( noticesStore );

	const { editedRecord: template, hasResolved } = useEntityRecord(
		'postType',
		'wp_template',
		templateId
	);

	const [ blocks ] = useEntityBlockEditor( 'postType', 'wp_template', {
		id: templateId,
	} );

	if ( ! hasResolved ) {
		return null;
	}

	// The site editor does not have a `onNavigateToPreviousEntityRecord` setting as it uses its own routing
	// and assigns its own backlink to focusMode pages.
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

	const renderPreview = () => {
		if ( ! previewContent ) {
			return null;
		}

		if ( hasSwapTargets ) {
			const tooltipText = __( 'Change template' );
			return (
				<Tooltip text={ tooltipText }>
					<div
						className="editor-template-actions-panel__preview"
						role="button"
						tabIndex={ 0 }
						aria-label={ tooltipText }
						onClick={ () => setIsSwapModalOpen( true ) }
						onKeyPress={ () => setIsSwapModalOpen( true ) }
					>
						{ previewContent }
					</div>
				</Tooltip>
			);
		}

		return (
			<div className="editor-template-actions-panel__preview">
				{ previewContent }
			</div>
		);
	};

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
					{ renderPreview() }
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
			{ isSwapModalOpen && (
				<SwapTemplateModal
					onRequestClose={ () => setIsSwapModalOpen( false ) }
				/>
			) }
		</>
	);
}
