/**
 * WordPress dependencies
 */
import { Icon, MenuGroup, DropdownMenu, MenuItem } from '@wordpress/components';
import { PostPreviewButton, store as editorStore } from '@wordpress/editor';
import { external, check } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { useViewportMatch } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../../store';

export default function ViewMenu() {
	const {
		hasActiveMetaboxes,
		isPostSaveable,
		isSaving,
		deviceType,
		supportsTemplateMode,
		isTemplateMode,
		template,
	} = useSelect( ( select ) => {
		const { getCurrentPostType, isEditedPostSaveable } = select(
			editorStore
		);
		const { getPostType } = select( coreStore );
		const {
			isEditingTemplate,
			getEditedPostTemplate,
			hasMetaBoxes,
			isSavingMetaBoxes,
			__experimentalGetPreviewDeviceType,
		} = select( editPostStore );

		const isViewable =
			getPostType( getCurrentPostType() )?.viewable ?? false;
		const _supportsTemplateMode =
			select( editorStore ).getEditorSettings().supportsTemplateMode &&
			isViewable;

		return {
			hasActiveMetaboxes: hasMetaBoxes(),
			isSaving: isSavingMetaBoxes(),
			isPostSaveable: isEditedPostSaveable(),
			deviceType: __experimentalGetPreviewDeviceType(),
			template: _supportsTemplateMode && getEditedPostTemplate(),
			isTemplateMode: isEditingTemplate(),
			supportsTemplateMode: _supportsTemplateMode,
		};
	}, [] );
	const {
		__experimentalSetPreviewDeviceType,
		setIsEditingTemplate,
	} = useDispatch( editPostStore );

	const isMobile = useViewportMatch( 'small', '<' );

	if ( isMobile ) {
		return (
			<PostPreviewButton
				forceIsAutosaveable={ hasActiveMetaboxes }
				forcePreviewLink={ isSaving ? null : undefined }
			/>
		);
	}

	const setPreviewDeviceType = ( newDeviceType ) => {
		if ( isTemplateMode ) {
			setIsEditingTemplate( false );
		}
		__experimentalSetPreviewDeviceType( newDeviceType );
	};

	const popoverProps = {
		position: 'bottom left',
	};

	return (
		<DropdownMenu
			popoverProps={ popoverProps }
			toggleProps={ {
				isTertiary: true,
				disabled: ! isPostSaveable,
				/* translators: button label text should, if possible, be under 16 characters. */
				children: __( 'View' ),
			} }
			icon={ null }
		>
			{ () => (
				<>
					<MenuGroup>
						<MenuItem
							onClick={ () => setPreviewDeviceType( 'Desktop' ) }
							icon={
								! isTemplateMode &&
								deviceType === 'Desktop' &&
								check
							}
						>
							{ __( 'Desktop' ) }
						</MenuItem>
						<MenuItem
							onClick={ () => setPreviewDeviceType( 'Tablet' ) }
							icon={
								! isTemplateMode &&
								deviceType === 'Tablet' &&
								check
							}
						>
							{ __( 'Tablet' ) }
						</MenuItem>
						<MenuItem
							onClick={ () => setPreviewDeviceType( 'Mobile' ) }
							icon={
								! isTemplateMode &&
								deviceType === 'Mobile' &&
								check
							}
						>
							{ __( 'Mobile' ) }
						</MenuItem>
					</MenuGroup>
					{ supportsTemplateMode && !! template && (
						<MenuGroup>
							<MenuItem
								onClick={ () =>
									setIsEditingTemplate( ! isTemplateMode )
								}
								icon={ isTemplateMode && check }
							>
								{ __( 'Template' ) }
							</MenuItem>
						</MenuGroup>
					) }
					<MenuGroup>
						<PostPreviewButton
							className="edit-post-view__preview-externally"
							role="menuitem"
							forceIsAutosaveable={ hasActiveMetaboxes }
							forcePreviewLink={ isSaving ? null : undefined }
							textContent={
								<>
									{ __( 'Preview in new tab' ) }
									<Icon icon={ external } />
								</>
							}
						/>
					</MenuGroup>
				</>
			) }
		</DropdownMenu>
	);
}
