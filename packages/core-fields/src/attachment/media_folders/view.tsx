import useMediaFolders, { MEDIA_FOLDERS_FIELD } from './use-media-folders';
import type { MediaItemWithFolders } from './types';

/*
 * The folders a media item is filed under, as a list of names. A media item
 * in no folder renders nothing, so a panel row shows the field's placeholder.
 */
export default function MediaFoldersView( {
	item,
}: {
	item: MediaItemWithFolders;
} ) {
	const { folders } = useMediaFolders();
	const ids = item?.[ MEDIA_FOLDERS_FIELD ] ?? [];
	const byId = new Map( folders.map( ( { id, name } ) => [ id, name ] ) );
	const names = ids
		.map( ( id ) => byId.get( id ) )
		.filter( ( name ): name is string => !! name );

	if ( ! names.length ) {
		return null;
	}

	return <span>{ names.join( ', ' ) }</span>;
}
