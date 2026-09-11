import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
// eslint-disable-next-line @wordpress/use-recommended-components -- Use the portal-based popup so the folder list isn't clipped by the panel's scroll container.
import { SelectControl, Stack } from '@wordpress/ui';
import { plus } from '@wordpress/icons';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * A `wp_media_folder` term, as supplied by the host editor.
 */
export type MediaFolder = {
	id: number;
	name: string;
};

type FolderSelectProps = {
	folders: MediaFolder[];
	/**
	 * The selected folder's id, or `undefined` for all folders.
	 */
	value?: number;
	onChange: ( folderId?: number ) => void;
	/**
	 * Called to start creating a folder. The "New folder" button is only
	 * rendered when set.
	 */
	onCreate?: () => void;
};

type FolderItem = {
	value: string | null;
	label: string;
};

const ALL_FOLDERS: FolderItem = { value: null, label: __( 'All folders' ) };

/**
 * The folder filter beneath a media source's search: a dropdown listing every
 * folder (plus "All folders"), and a button to create one.
 */
export default function FolderSelect( {
	folders,
	value,
	onChange,
	onCreate,
}: FolderSelectProps ) {
	const items = useMemo< FolderItem[] >(
		() => [
			ALL_FOLDERS,
			...folders.map( ( folder ) => ( {
				value: String( folder.id ),
				label: decodeEntities( folder.name ),
			} ) ),
		],
		[ folders ]
	);
	const selected =
		items.find( ( item ) => item.value === String( value ) ) ?? ALL_FOLDERS;

	return (
		<Stack
			direction="row"
			gap="xs"
			align="flex-end"
			className="block-editor-inserter__media-grid__filters"
		>
			<SelectControl
				className="block-editor-inserter__media-folder-select"
				label={ __( 'Folder' ) }
				hideLabelFromVision
				popupWidth="anchor"
				items={ items }
				value={ selected }
				onValueChange={ ( item: FolderItem | null ) =>
					onChange( item?.value ? Number( item.value ) : undefined )
				}
			/>
			{ onCreate && (
				<Button
					__next40pxDefaultSize
					icon={ plus }
					label={ __( 'New folder' ) }
					onClick={ onCreate }
				/>
			) }
		</Stack>
	);
}
