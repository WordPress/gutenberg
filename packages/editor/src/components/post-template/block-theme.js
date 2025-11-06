/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { useState, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useEntityRecord, store as coreStore } from '@wordpress/core-data';
import { check } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import PostPanelRow from '../post-panel-row';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import SwapTemplateButton from './swap-template-button';
import ResetDefaultTemplate from './reset-default-template';
import { unlock } from '../../lock-unlock';
import CreateNewTemplate from './create-new-template';

export default function BlockThemeControl( { id } ) {
	const {
		isTemplateHidden,
		onNavigateToEntityRecord,
		getEditorSettings,
		hasGoBack,
	} = useSelect( ( select ) => {
		const { getRenderingMode, getEditorSettings: _getEditorSettings } =
			unlock( select( editorStore ) );
		const editorSettings = _getEditorSettings();
		return {
			isTemplateHidden: getRenderingMode() === 'post-only',
			onNavigateToEntityRecord: editorSettings.onNavigateToEntityRecord,
			getEditorSettings: _getEditorSettings,
			hasGoBack: editorSettings.hasOwnProperty(
				'onNavigateToPreviousEntityRecord'
			),
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
	// Memoize popoverProps to avoid returning a new object every time.
	const popoverProps = useMemo(
		() => ( {
			// Anchor the popover to the middle of the entire row so that it doesn't
			// move around when the label changes.
			anchor: popoverAnchor,
			className: 'editor-post-template__dropdown',
			placement: 'left-start',
			offset: 36,
			shift: true,
		} ),
		[ popoverAnchor ]
	);

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
	return (
		<PostPanelRow label={ __( 'Template' ) } ref={ setPopoverAnchor }>
			<DropdownMenu
				popoverProps={ popoverProps }
				focusOnMount
				toggleProps={ {
					size: 'compact',
					variant: 'tertiary',
					tooltipPosition: 'middle left',
				} }
				label={ __( 'Template options' ) }
				text={ decodeEntities( template.title ) }
				icon={ null }
			>
				{ ( { onClose } ) => (
					<>
						<MenuGroup>
							{ canCreateTemplate && (
								<MenuItem
									onClick={ () => {
										onNavigateToEntityRecord( {
											postId: template.id,
											postType: 'wp_template',
										} );
										onClose();
										mayShowTemplateEditNotice();
									} }
								>
									{ __( 'Edit template' ) }
								</MenuItem>
							) }

							<SwapTemplateButton onClick={ onClose } />
							<ResetDefaultTemplate onClick={ onClose } />
							{ canCreateTemplate && <CreateNewTemplate /> }
						</MenuGroup>
						<MenuGroup>
							<MenuItem
								icon={ ! isTemplateHidden ? check : undefined }
								isSelected={ ! isTemplateHidden }
								role="menuitemcheckbox"
								onClick={ () => {
									const newRenderingMode = isTemplateHidden
										? 'template-locked'
										: 'post-only';
									setRenderingMode( newRenderingMode );
									setDefaultRenderingMode( newRenderingMode );
								} }
							>
								{ __( 'Show template' ) }
							</MenuItem>
						</MenuGroup>
					</>
				) }
			</DropdownMenu>
		</PostPanelRow>
	);
}
