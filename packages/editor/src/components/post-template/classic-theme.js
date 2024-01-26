/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { SelectControl, Dropdown, Button, Notice } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __experimentalInspectorPopoverHeader as InspectorPopoverHeader } from '@wordpress/block-editor';
import { useState, useMemo } from '@wordpress/element';
import { addTemplate } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import CreateNewTemplateModal from './create-new-template-modal';
import { useAllowSwitchingTemplates } from './hooks';

const POPOVER_PROPS = {
	className: 'editor-post-template__dropdown',
	placement: 'bottom-start',
};

function PostTemplateToggle( { isOpen, onClick } ) {
	const templateTitle = useSelect( ( select ) => {
		const templateSlug =
			select( editorStore ).getEditedPostAttribute( 'template' );

		const { supportsTemplateMode, availableTemplates } =
			select( editorStore ).getEditorSettings();
		if ( ! supportsTemplateMode && availableTemplates[ templateSlug ] ) {
			return availableTemplates[ templateSlug ];
		}
		const template =
			select( coreStore ).canUser( 'create', 'templates' ) &&
			select( editorStore ).getCurrentTemplateId();
		return (
			template?.title ||
			template?.slug ||
			availableTemplates?.[ templateSlug ]
		);
	}, [] );

	return (
		<Button
			className="edit-post-post-template__toggle"
			variant="tertiary"
			aria-expanded={ isOpen }
			aria-label={ __( 'Template options' ) }
			onClick={ onClick }
		>
			{ templateTitle ?? __( 'Default template' ) }
		</Button>
	);
}

function PostTemplateDropdownContent( { onClose } ) {
	const allowSwitchingTemplate = useAllowSwitchingTemplates();
	const {
		availableTemplates,
		fetchedTemplates,
		selectedTemplateSlug,
		canCreate,
		canEdit,
		currentTemplateId,
		getPostLinkProps,
		getEditorSettings,
	} = useSelect(
		( select ) => {
			const { canUser, getEntityRecords } = select( coreStore );
			const editorSettings = select( editorStore ).getEditorSettings();
			const canCreateTemplates = canUser( 'create', 'templates' );
			const _currentTemplateId =
				select( editorStore ).getCurrentTemplateId();
			return {
				availableTemplates: editorSettings.availableTemplates,
				fetchedTemplates: canCreateTemplates
					? getEntityRecords( 'postType', 'wp_template', {
							post_type:
								select( editorStore ).getCurrentPostType(),
							per_page: -1,
					  } )
					: undefined,
				selectedTemplateSlug:
					select( editorStore ).getEditedPostAttribute( 'template' ),
				canCreate:
					allowSwitchingTemplate &&
					canCreateTemplates &&
					editorSettings.supportsTemplateMode,
				canEdit:
					allowSwitchingTemplate &&
					canCreateTemplates &&
					editorSettings.supportsTemplateMode &&
					!! _currentTemplateId,
				currentTemplateId: _currentTemplateId,
				getPostLinkProps: editorSettings.getPostLinkProps,
				getEditorSettings: select( editorStore ).getEditorSettings,
			};
		},
		[ allowSwitchingTemplate ]
	);

	const editTemplate =
		getPostLinkProps && currentTemplateId
			? getPostLinkProps( {
					postId: currentTemplateId,
					postType: 'wp_template',
			  } )
			: {};

	const options = useMemo(
		() =>
			Object.entries( {
				...availableTemplates,
				...Object.fromEntries(
					( fetchedTemplates ?? [] ).map( ( { slug, title } ) => [
						slug,
						title.rendered,
					] )
				),
			} ).map( ( [ slug, title ] ) => ( { value: slug, label: title } ) ),
		[ availableTemplates, fetchedTemplates ]
	);

	const selectedOption =
		options.find( ( option ) => option.value === selectedTemplateSlug ) ??
		options.find( ( option ) => ! option.value ); // The default option has '' value.

	const { editPost } = useDispatch( editorStore );
	const { createSuccessNotice } = useDispatch( noticesStore );
	const [ isCreateModalOpen, setIsCreateModalOpen ] = useState( false );

	return (
		<div className="editor-post-template__classic-theme-dropdown">
			<InspectorPopoverHeader
				title={ __( 'Template' ) }
				help={ __(
					'Templates define the way content is displayed when viewing your site.'
				) }
				actions={
					canCreate
						? [
								{
									icon: addTemplate,
									label: __( 'Add template' ),
									onClick: () => setIsCreateModalOpen( true ),
								},
						  ]
						: []
				}
				onClose={ onClose }
			/>
			{ ! allowSwitchingTemplate ? (
				<Notice status="warning" isDismissible={ false }>
					{ __( 'The posts page template cannot be changed.' ) }
				</Notice>
			) : (
				<SelectControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					hideLabelFromVision
					label={ __( 'Template' ) }
					value={ selectedOption?.value ?? '' }
					options={ options }
					onChange={ ( slug ) =>
						editPost( { template: slug || '' } )
					}
				/>
			) }
			{ canEdit && (
				<p>
					<Button
						variant="link"
						onClick={ () => {
							editTemplate.onClick();
							onClose();
							createSuccessNotice(
								__(
									'Editing template. Changes made here affect all posts and pages that use the template.'
								),
								{
									type: 'snackbar',
									actions: [
										{
											label: __( 'Go back' ),
											onClick: () =>
												getEditorSettings().goBack(),
										},
									],
								}
							);
						} }
					>
						{ __( 'Edit template' ) }
					</Button>
				</p>
			) }
			{ isCreateModalOpen && (
				<CreateNewTemplateModal
					onClose={ () => setIsCreateModalOpen( false ) }
				/>
			) }
		</div>
	);
}

function ClassicThemeControl() {
	return (
		<Dropdown
			popoverProps={ POPOVER_PROPS }
			focusOnMount
			renderToggle={ ( { isOpen, onToggle } ) => (
				<PostTemplateToggle isOpen={ isOpen } onClick={ onToggle } />
			) }
			renderContent={ ( { onClose } ) => (
				<PostTemplateDropdownContent onClose={ onClose } />
			) }
		/>
	);
}

export default ClassicThemeControl;
