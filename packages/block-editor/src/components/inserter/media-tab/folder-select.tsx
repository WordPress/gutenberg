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
	 * The selected folder's id, or `undefined` for none (all folders when
	 * `includeAll` is set).
	 */
	value?: number;
	onChange: ( folderId?: number ) => void;
	/**
	 * Whether to offer an "All folders" choice, for filtering. Off when a
	 * single folder must be chosen, e.g. when filing an item.
	 *
	 * @default true
	 */
	includeAll?: boolean;
	/**
	 * Whether the "Folder" label is visible.
	 *
	 * @default false
	 */
	showLabel?: boolean;
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
 * A dropdown of media folders: beneath a source's search it filters the grid
 * (with "All folders" and a button to create one); in the "Add to folder"
 * modal it picks the destination.
 */
export default function FolderSelect( {
	folders,
	value,
	onChange,
	includeAll = true,
	showLabel = false,
	onCreate,
}: FolderSelectProps ) {
	const items = useMemo< FolderItem[] >(
		() => [
			...( includeAll ? [ ALL_FOLDERS ] : [] ),
			...folders.map( ( folder ) => ( {
				value: String( folder.id ),
				label: decodeEntities( folder.name ),
			} ) ),
		],
		[ folders, includeAll ]
	);
	const selected =
		items.find( ( item ) => item.value === String( value ) ) ??
		( includeAll ? ALL_FOLDERS : null );

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
				hideLabelFromVision={ ! showLabel }
				placeholder={ __( 'Select a folder' ) }
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
