/**
 * WordPress dependencies
 */
import { Icon, MenuGroup } from '@wordpress/components';
import { PostPreviewButton, store as editorStore } from '@wordpress/editor';
import { external } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { __experimentalPreviewOptions as PreviewOptions } from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../store';

export default function DevicePreview() {
	const {
		hasActiveMetaboxes,
		isPostSaveable,
		isSaving,
		deviceType,
	} = useSelect(
		( select ) => ( {
			hasActiveMetaboxes: select( editPostStore ).hasMetaBoxes(),
			isSaving: select( editPostStore ).isSavingMetaBoxes(),
			isPostSaveable: select( editorStore ).isEditedPostSaveable(),
			deviceType: select(
				editPostStore
			).__experimentalGetPreviewDeviceType(),
		} ),
		[]
	);
	const {
		__experimentalSetPreviewDeviceType: setPreviewDeviceType,
	} = useDispatch( editPostStore );

	return (
		<PreviewOptions
			isEnabled={ isPostSaveable }
			className="edit-post-post-preview-dropdown"
			deviceType={ deviceType }
			setDeviceType={ setPreviewDeviceType }
		>
			<MenuGroup>
				<div className="edit-post-header-preview__grouping-external">
					<PostPreviewButton
						className={
							'edit-post-header-preview__button-external'
						}
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
				</div>
			</MenuGroup>
		</PreviewOptions>
	);
}
