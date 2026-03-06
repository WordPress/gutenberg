/**
 * WordPress dependencies
 */
import {
	Button,
	Modal,
	SearchControl,
	Icon,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore, useEntityRecord } from '@wordpress/core-data';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as noticesStore } from '@wordpress/notices';
import {
	store as blockEditorStore,
	__experimentalBlockPatternsList as BlockPatternsList,
} from '@wordpress/block-editor';
import { layout, pencil, reusableBlock, plus, backup } from '@wordpress/icons';
import { useMemo, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { parse } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import {
	useAvailableTemplates,
	useEditedPostContext,
	useCurrentTemplateSlug,
	useAllowSwitchingTemplates,
} from '../post-template/hooks';
import CreateNewTemplateModal from '../post-template/create-new-template-modal';
import { searchTemplates } from '../../utils/search-templates';
import { unlock } from '../../lock-unlock';

const { Menu } = unlock( componentsPrivateApis );

export default function TemplateDropdown() {
	const {
		templateId,
		renderingMode,
		onNavigateToEntityRecord,
		getEditorSettings,
		hasGoBack,
		hasSpecificTemplate,
		showIconLabels,
		canCreateTemplate,
		hasWelcomeGuideTemplate,
	} = useSelect( ( select ) => {
		const {
			getCurrentTemplateId,
			getRenderingMode,
			getEditorSettings: _getEditorSettings,
			getCurrentPost,
		} = unlock( select( editorStore ) );
		const { get } = select( preferencesStore );
		const editorSettings = _getEditorSettings();
		const currentPost = getCurrentPost();
		return {
			templateId: getCurrentTemplateId(),
			renderingMode: getRenderingMode(),
			onNavigateToEntityRecord: editorSettings.onNavigateToEntityRecord,
			getEditorSettings: _getEditorSettings,
			hasGoBack: editorSettings.hasOwnProperty(
				'onNavigateToPreviousEntityRecord'
			),
			hasSpecificTemplate: !! currentPost.template,
			showIconLabels: get( 'core', 'showIconLabels' ),
			canCreateTemplate: !! select( coreStore ).canUser( 'create', {
				kind: 'postType',
				name: 'wp_template',
			} ),
			hasWelcomeGuideTemplate: !! get(
				'core/edit-site',
				'welcomeGuideTemplate'
			),
		};
	}, [] );

	const { editedRecord: template, hasResolved } = useEntityRecord(
		'postType',
		'wp_template',
		templateId
	);

	const { getEntityRecord } = useSelect( coreStore );
	const { editEntityRecord } = useDispatch( coreStore );
	const { createSuccessNotice } = useDispatch( noticesStore );
	const { setRenderingMode, setDefaultRenderingMode } = unlock(
		useDispatch( editorStore )
	);
	const _blockEditorActions = useDispatch( blockEditorStore );

	const { postType: editedPostType, postId: editedPostId } =
		useEditedPostContext();
	const availableTemplates = useAvailableTemplates( editedPostType );
	const currentTemplateSlug = useCurrentTemplateSlug();
	const allowSwitchingTemplate = useAllowSwitchingTemplates();

	const [ showSwapModal, setShowSwapModal ] = useState( false );
	const [ showCreateModal, setShowCreateModal ] = useState( false );

	if ( ! templateId || ! hasResolved ) {
		return null;
	}

	const { resetZoomLevel } = unlock( _blockEditorActions );

	// The site editor does not have a `onNavigateToPreviousEntityRecord`
	// setting as it uses its own routing and assigns its own backlink
	// to focusMode pages.
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
		if ( ! hasWelcomeGuideTemplate ) {
			createSuccessNotice(
				__(
					'Editing template. Changes made here affect all posts and pages that use the template.'
				),
				{ type: 'snackbar', actions: notificationAction }
			);
		}
	};

	const onTemplateSelect = ( selectedTemplate ) => {
		editEntityRecord(
			'postType',
			editedPostType,
			editedPostId,
			{ template: selectedTemplate.name },
			{ undoIgnore: true }
		);
		setShowSwapModal( false );
	};

	const handleVisibilityChange = ( newRenderingMode ) => {
		setRenderingMode( newRenderingMode );
		setDefaultRenderingMode( newRenderingMode );
		resetZoomLevel();
	};

	return (
		<>
			<Menu placement="bottom-end">
				<Menu.TriggerButton
					render={
						<Button
							size="compact"
							showTooltip={ ! showIconLabels }
							icon={ layout }
							label={ __( 'Template' ) }
							className="editor-template-dropdown"
						/>
					}
				/>
				<Menu.Popover>
					<Menu.Group>
						<Menu.GroupLabel>{ __( 'Template' ) }</Menu.GroupLabel>
						{ canCreateTemplate && (
							<Menu.Item
								prefix={ <Icon icon={ pencil } /> }
								onClick={ async () => {
									onNavigateToEntityRecord( {
										postId: template.id,
										postType: 'wp_template',
									} );
									if (
										! hasSpecificTemplate &&
										window?.__experimentalTemplateActivate
									) {
										const activeTemplates =
											await getEntityRecord(
												'root',
												'site'
											).active_templates;
										if (
											activeTemplates[ template.slug ] !==
											template.id
										) {
											editEntityRecord(
												'root',
												'site',
												undefined,
												{
													active_templates: {
														...activeTemplates,
														[ template.slug ]:
															template.id,
													},
												}
											);
										}
									}
									mayShowTemplateEditNotice();
								} }
							>
								<Menu.ItemLabel>
									{ __( 'Edit template' ) }
								</Menu.ItemLabel>
							</Menu.Item>
						) }
						<Menu.Item
							disabled={ ! availableTemplates?.length }
							onClick={ () => setShowSwapModal( true ) }
							prefix={ <Icon icon={ reusableBlock } /> }
						>
							<Menu.ItemLabel>
								{ __( 'Change template' ) }
							</Menu.ItemLabel>
						</Menu.Item>
						{ !! currentTemplateSlug && allowSwitchingTemplate && (
							<Menu.Item
								prefix={ <Icon icon={ backup } /> }
								onClick={ () => {
									editEntityRecord(
										'postType',
										editedPostType,
										editedPostId,
										{ template: '' },
										{ undoIgnore: true }
									);
								} }
							>
								<Menu.ItemLabel>
									{ __( 'Use default' ) }
								</Menu.ItemLabel>
							</Menu.Item>
						) }
						{ canCreateTemplate && allowSwitchingTemplate && (
							<Menu.Item
								onClick={ () => setShowCreateModal( true ) }
								prefix={ <Icon icon={ plus } /> }
							>
								<Menu.ItemLabel>
									{ __( 'Create new' ) }
								</Menu.ItemLabel>
							</Menu.Item>
						) }
					</Menu.Group>
					<Menu.Separator />
					<Menu.Group>
						<Menu.GroupLabel>
							{ __( 'Template visibility' ) }
						</Menu.GroupLabel>
						<Menu.RadioItem
							name="template-visibility"
							value="template-locked"
							checked={ renderingMode === 'template-locked' }
							onChange={ () =>
								handleVisibilityChange( 'template-locked' )
							}
						>
							<Menu.ItemLabel>{ __( 'Show' ) }</Menu.ItemLabel>
						</Menu.RadioItem>
						<Menu.RadioItem
							name="template-visibility"
							value="post-only"
							checked={ renderingMode === 'post-only' }
							onChange={ () =>
								handleVisibilityChange( 'post-only' )
							}
						>
							<Menu.ItemLabel>{ __( 'Hide' ) }</Menu.ItemLabel>
						</Menu.RadioItem>
					</Menu.Group>
				</Menu.Popover>
			</Menu>
			{ showSwapModal && (
				<Modal
					title={ __( 'Choose a template' ) }
					onRequestClose={ () => setShowSwapModal( false ) }
					overlayClassName="editor-post-template__swap-template-modal"
					isFullScreen
				>
					<div className="editor-post-template__swap-template-modal-content">
						<TemplatesList
							postType={ editedPostType }
							onSelect={ onTemplateSelect }
						/>
					</div>
				</Modal>
			) }
			{ showCreateModal && (
				<CreateNewTemplateModal
					onClose={ () => setShowCreateModal( false ) }
				/>
			) }
		</>
	);
}

function TemplatesList( { postType, onSelect } ) {
	const [ searchValue, setSearchValue ] = useState( '' );
	const availableTemplates = useAvailableTemplates( postType );
	const templatesAsPatterns = useMemo(
		() =>
			availableTemplates.map( ( template ) => ( {
				name: template.slug,
				blocks: parse( template.content.raw ),
				title: decodeEntities( template.title.rendered ),
				id: template.id,
			} ) ),
		[ availableTemplates ]
	);

	const filteredBlockTemplates = useMemo( () => {
		return searchTemplates( templatesAsPatterns, searchValue );
	}, [ templatesAsPatterns, searchValue ] );

	return (
		<>
			<SearchControl
				onChange={ setSearchValue }
				value={ searchValue }
				label={ __( 'Search' ) }
				placeholder={ __( 'Search' ) }
				className="editor-post-template__swap-template-search"
			/>
			<BlockPatternsList
				label={ __( 'Templates' ) }
				blockPatterns={ filteredBlockTemplates }
				onClickPattern={ onSelect }
			/>
		</>
	);
}
