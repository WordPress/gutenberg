/**
 * WordPress dependencies
 */
import { Icon, MenuGroup, DropdownMenu, MenuItem } from '@wordpress/components';
import { PostPreviewButton, store as editorStore } from '@wordpress/editor';
import { external, check } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { useViewportMatch } from '@wordpress/compose';

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
	} = useSelect( ( select ) => {
		const { isEditedPostSaveable } = select( editorStore );
		const {
			hasMetaBoxes,
			isSavingMetaBoxes,
			__experimentalGetPreviewDeviceType,
		} = select( editPostStore );

		return {
			hasActiveMetaboxes: hasMetaBoxes(),
			isSaving: isSavingMetaBoxes(),
			isPostSaveable: isEditedPostSaveable(),
			deviceType: __experimentalGetPreviewDeviceType(),
		};
	}, [] );
	const {
		__experimentalSetPreviewDeviceType: setPreviewDeviceType,
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
				children: __( 'Preview' ),
				className: 'edit-post-view__button-toggle',
			} }
			icon={ null }
		>
			{ () => (
				<>
					<MenuGroup>
						<MenuItem
							onClick={ () => setPreviewDeviceType( 'Desktop' ) }
							icon={ deviceType === 'Desktop' && check }
						>
							{ __( 'Desktop' ) }
						</MenuItem>
						<MenuItem
							onClick={ () => setPreviewDeviceType( 'Tablet' ) }
							icon={ deviceType === 'Tablet' && check }
						>
							{ __( 'Tablet' ) }
						</MenuItem>
						<MenuItem
							onClick={ () => setPreviewDeviceType( 'Mobile' ) }
							icon={ deviceType === 'Mobile' && check }
						>
							{ __( 'Mobile' ) }
						</MenuItem>
					</MenuGroup>
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
