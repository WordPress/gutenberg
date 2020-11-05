/**
 * WordPress dependencies
 */
import { Icon, MenuGroup } from '@wordpress/components';
import {
	PostPreviewButton,
	useSelect as useCoreEditorSelect,
} from '@wordpress/editor';
import { external } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { __experimentalPreviewOptions as PreviewOptions } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import {
	useDispatch as useEditPostDispatch,
	useSelect as useEditPostSelect,
} from '../../store';

export default function DevicePreview() {
	const [ isPostSaveable ] = useCoreEditorSelect( [
		'isEditedPostSaveable',
	] );
	const [ hasActiveMetaboxes, isSaving, deviceType ] = useEditPostSelect( [
		'hasMetaBoxes',
		'isSavingMetaBoxes',
		'__experimentalGetPreviewDeviceType',
	] );
	const {
		__experimentalSetPreviewDeviceType: setPreviewDeviceType,
	} = useEditPostDispatch();

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
