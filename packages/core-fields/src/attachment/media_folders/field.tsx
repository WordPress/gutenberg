import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import type { FieldsScriptParts } from '../../types';
import MediaFoldersEdit from './edit';
import MediaFoldersView from './view';
import {
	MEDIA_FOLDERS_QUERY,
	MEDIA_FOLDERS_TAXONOMY,
} from './use-media-folders';
import type { MediaFolder } from './use-media-folders';
import type { MediaItemWithFolders } from './types';

/**
 * The JavaScript parts of the media folders field; its data is in
 * `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< MediaItemWithFolders >[ string ] =
	{
		Edit: MediaFoldersEdit,
		render: MediaFoldersView,
		/*
		 * The options of the field's filter. The value is a list of term ids,
		 * so the names come from the terms; resolved on the client rather than
		 * serialized with the field, so a folder created during the session is
		 * offered too.
		 */
		getElements: async () => {
			const folders =
				( await resolveSelect(
					coreStore
				).getEntityRecords< MediaFolder >(
					'taxonomy',
					MEDIA_FOLDERS_TAXONOMY,
					MEDIA_FOLDERS_QUERY
				) ) ?? [];
			return folders.map( ( { id, name } ) => ( {
				value: id,
				label: decodeEntities( name ),
			} ) );
		},
	};
