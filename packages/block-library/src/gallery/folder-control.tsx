import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Notice, SelectControl } from '@wordpress/ui';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Every media folder, alphabetically — the options for the chooser below.
 * Matches the query the inserter's folder filter uses, so both read from one
 * resolved list rather than issuing separate requests.
 */
const MEDIA_FOLDERS_QUERY = {
	per_page: -1,
	hide_empty: false,
	orderby: 'name',
	order: 'asc',
};

type MediaFolder = {
	id: number;
	name: string;
};

type FolderItem = {
	// Widened to match the shape `SelectControl` hands back, whose items may
	// carry a null value. Every item built here has an id.
	value: string | null;
	label: string;
};

type FolderControlProps = {
	/** The selected folder's id, or `undefined` for none. */
	folderId?: number;
	onChange: ( folderId?: number ) => void;
	/** The control's label. */
	label: string;
};

/**
 * "Folder" control for a media folder gallery: which folder's images to show.
 *
 * Unlike the ordering control this isn't an optional setting — a folder gallery
 * with no folder resolves to nothing — so it renders as a plain control rather
 * than a resettable `ToolsPanelItem`, and offers no way back to no folder at
 * all.
 */
export default function FolderControl( {
	folderId,
	onChange,
	label,
}: FolderControlProps ) {
	const folders = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecords(
				'taxonomy',
				'wp_media_folder',
				MEDIA_FOLDERS_QUERY
			) as MediaFolder[] | null,
		[]
	);

	// A folder that has since been deleted (or isn't readable) leaves an id with
	// no matching option. Surface it rather than silently showing the control as
	// unset, which would misrepresent what the block is pointed at.
	const isMissing =
		folderId !== undefined &&
		!! folders &&
		! folders.some( ( folder ) => folder.id === folderId );

	const items = useMemo< FolderItem[] >(
		() => [
			...( folders ?? [] ).map( ( folder ) => ( {
				value: String( folder.id ),
				label: decodeEntities( folder.name ),
			} ) ),
			...( isMissing
				? [
						{
							value: String( folderId ),
							label: __( 'Folder not found' ),
						},
					]
				: [] ),
		],
		[ folders, folderId, isMissing ]
	);

	const selected =
		items.find( ( item ) => item.value === String( folderId ) ) ?? null;

	return (
		<>
			<SelectControl
				label={ label }
				placeholder={ __( 'Select a folder' ) }
				popupWidth="anchor"
				items={ items }
				value={ selected }
				onValueChange={ ( item: FolderItem | null ) =>
					onChange( item?.value ? Number( item.value ) : undefined )
				}
			/>
			{ isMissing && (
				<Notice.Root intent="warning">
					<Notice.Description>
						{ __(
							'The selected folder no longer exists. Choose another folder to display images.'
						) }
					</Notice.Description>
				</Notice.Root>
			) }
		</>
	);
}
