import { useSelect, useDispatch } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { Button } from '@wordpress/components';
// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
import { Menu } from '@wordpress/ui';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useEntityRecord, store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { store as preferencesStore } from '@wordpress/preferences';
import PostPanelRow from '../post-panel-row';
import { store as editorStore } from '../../store';
import SwapTemplateButton, { SwapTemplateModal } from './swap-template-button';
import ResetDefaultTemplate from './reset-default-template';
import { unlock } from '../../lock-unlock';
import CreateNewTemplate from './create-new-template';
import CreateNewTemplateModal from './create-new-template-modal';

export default function BlockThemeControl() {
	const {
		isTemplateHidden,
		onNavigateToEntityRecord,
		getEditorSettings,
		hasGoBack,
		hasRenderingMode,
		id,
	} = useSelect( ( select ) => {
		const {
			getRenderingMode,
			getEditorSettings: _getEditorSettings,
			getCurrentTemplateId,
		} = unlock( select( editorStore ) );
		const editorSettings = _getEditorSettings();
		return {
			isTemplateHidden: getRenderingMode() === 'post-only',
			onNavigateToEntityRecord: editorSettings.onNavigateToEntityRecord,
			getEditorSettings: _getEditorSettings,
			hasGoBack: editorSettings.hasOwnProperty(
				'onNavigateToPreviousEntityRecord'
			),
			hasRenderingMode: !! editorSettings.renderingMode,
			id: getCurrentTemplateId(),
		};
	}, [] );

	const { get: getPreference } = useSelect( preferencesStore );

	const { editedRecord: template, hasResolved } = useEntityRecord(
		'postType',
		'wp_template',
		id
	);
	const { createSuccessNotice } = useDispatch( noticesStore );
	const { setRenderingMode, setDefaultRenderingMode } = unlock(
		useDispatch( editorStore )
	);

	const canCreateTemplate = useSelect(
		( select ) =>
			!! select( coreStore ).canUser( 'create', {
				kind: 'postType',
				name: 'wp_template',
			} ),
		[]
	);

	const [ popoverAnchor, setPopoverAnchor ] = useState( null );
	const [ activeModal, setActiveModal ] = useState( null );

	if ( ! hasResolved ) {
		return null;
	}

	// The site editor does not have a `onNavigateToPreviousEntityRecord` setting as it uses its own routing
	// and assigns its own backlink to focusMode pages.
	const notificationAction = hasGoBack
		? [
				{
					label: __( 'Back' ),
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
	return (
		<>
			<PostPanelRow label={ __( 'Template' ) } ref={ setPopoverAnchor }>
				<Menu.Root>
					<Menu.Trigger
						render={
							<Button
								size="compact"
								variant="tertiary"
								tooltipPosition="middle left"
								label={ __( 'Template options' ) }
							/>
						}
					>
						{ decodeEntities( template.title ) }
					</Menu.Trigger>
					<Menu.Popup
						className="editor-post-template__dropdown"
						positioner={
							<Menu.Positioner
								anchor={ popoverAnchor }
								side="left"
								align="start"
								sideOffset={ 36 }
							/>
						}
					>
						<Menu.Group>
							{ canCreateTemplate && (
								<Menu.Item
									onClick={ () => {
										onNavigateToEntityRecord( {
											postId: template.id,
											postType: 'wp_template',
										} );
										mayShowTemplateEditNotice();
									} }
								>
									<Menu.ItemLabel>
										{ __( 'Edit template' ) }
									</Menu.ItemLabel>
								</Menu.Item>
							) }
							<SwapTemplateButton
								onClick={ () => setActiveModal( 'swap' ) }
							/>
							<ResetDefaultTemplate />
							{ canCreateTemplate && (
								<CreateNewTemplate
									onClick={ () => setActiveModal( 'create' ) }
								/>
							) }
						</Menu.Group>
						{ ! hasRenderingMode && (
							<>
								<Menu.Separator />
								<Menu.Group>
									<Menu.CheckboxItem
										checked={ ! isTemplateHidden }
										closeOnClick={ false }
										onCheckedChange={ ( checked ) => {
											const newRenderingMode = checked
												? 'template-locked'
												: 'post-only';
											setRenderingMode(
												newRenderingMode
											);
											setDefaultRenderingMode(
												newRenderingMode
											);
										} }
									>
										<Menu.ItemLabel>
											{ __( 'Show template' ) }
										</Menu.ItemLabel>
									</Menu.CheckboxItem>
								</Menu.Group>
							</>
						) }
					</Menu.Popup>
				</Menu.Root>
			</PostPanelRow>
			{ activeModal === 'swap' && (
				<SwapTemplateModal
					onRequestClose={ () => setActiveModal( null ) }
				/>
			) }
			{ activeModal === 'create' && (
				<CreateNewTemplateModal
					onClose={ () => setActiveModal( null ) }
				/>
			) }
		</>
	);
}
