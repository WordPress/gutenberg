import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { useMemo } from '@wordpress/element';

/**
 * The property of the attachment record holding the folder term ids, which is
 * the `rest_base` of the taxonomy and the id of the field.
 */
export const MEDIA_FOLDERS_FIELD = 'media-folders';

export const MEDIA_FOLDERS_TAXONOMY = 'wp_media_folder';

/*
 * Every folder, not only the ones already in use, since the control files
 * media into them. `hide_empty` is false for the same reason.
 *
 * Shared with the `getElements` of `field.tsx`, so the control and the filter
 * read one resolution rather than issuing a request each.
 */
export const MEDIA_FOLDERS_QUERY = {
	per_page: -1,
	hide_empty: false,
	orderby: 'name',
	order: 'asc',
	context: 'view',
	_fields: 'id,name',
};

export interface MediaFolder {
	id: number;
	name: string;
}

/**
 * The folders of the site, with their names decoded, and whether they are
 * still loading.
 *
 * The names arrive HTML-encoded, and both the control and the view show them
 * as text, so they are decoded once here.
 */
export default function useMediaFolders() {
	const { folders, isResolving } = useSelect( ( select ) => {
		const { getEntityRecords, isResolving: _isResolving } =
			select( coreStore );
		return {
			folders: getEntityRecords< MediaFolder >(
				'taxonomy',
				MEDIA_FOLDERS_TAXONOMY,
				MEDIA_FOLDERS_QUERY
			),
			isResolving: _isResolving( 'getEntityRecords', [
				'taxonomy',
				MEDIA_FOLDERS_TAXONOMY,
				MEDIA_FOLDERS_QUERY,
			] ),
		};
	}, [] );

	return useMemo(
		() => ( {
			folders: ( folders ?? [] ).map( ( { id, name } ) => ( {
				id,
				name: decodeEntities( name ),
			} ) ),
			isResolving,
		} ),
		[ folders, isResolving ]
	);
}
