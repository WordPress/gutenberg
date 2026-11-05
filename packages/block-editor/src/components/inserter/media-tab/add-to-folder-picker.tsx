import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import FolderSelect from './folder-select';
import type { MediaFolder } from './folder-select';

/**
 * The body of the "Add to folder" action's modal: pick the destination.
 */
export default function AddToFolderPicker( {
	folders,
	onCancel,
	onConfirm,
}: {
	folders: MediaFolder[];
	onCancel: () => void;
	/**
	 * Called with the chosen folder's id.
	 */
	onConfirm: ( folderId: number ) => void;
} ) {
	const [ folderId, setFolderId ] = useState< number | undefined >();
	return (
		<>
			<FolderSelect
				folders={ folders }
				value={ folderId }
				onChange={ setFolderId }
				includeAll={ false }
				showLabel
			/>
			<div className="block-editor-inserter__media-panel-detach-actions">
				<Button
					__next40pxDefaultSize
					variant="tertiary"
					onClick={ onCancel }
				>
					{ __( 'Cancel' ) }
				</Button>
				<Button
					__next40pxDefaultSize
					variant="primary"
					// Nothing to add to until a folder is chosen, but keep the
					// button reachable so the requirement is discoverable.
					disabled={ folderId === undefined }
					accessibleWhenDisabled
					onClick={ () =>
						folderId !== undefined && onConfirm( folderId )
					}
				>
					{ __( 'Add' ) }
				</Button>
			</div>
		</>
	);
}
