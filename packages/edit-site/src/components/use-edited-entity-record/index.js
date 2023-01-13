/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';

export default function useEditedEntityRecord() {
	const { record, isLoaded } = useSelect( ( select ) => {
		const { getEditedPostType, getEditedPostId } = select( editSiteStore );
		const { getEditedEntityRecord } = select( coreStore );
		const postType = getEditedPostType();
		const postId = getEditedPostId();
		const _record = getEditedEntityRecord( 'postType', postType, postId );
		const _isLoaded = !! postId;

		return {
			record: _record,
			isLoaded: _isLoaded,
		};
	}, [] );

	return {
		isLoaded,
		record,
	};
}

export function useEntityRecordTitle( kind, type, id ) {
	const { title } = useSelect(
		( select ) => {
			const { getEntityRecord, getEntityConfig } = select( coreStore );
			const record = getEntityRecord( kind, type, id );
			const entityConfig = getEntityConfig( kind, type );
			return {
				title:
					record && entityConfig
						? decodeEntities( entityConfig.getTitle( record ) )
						: null,
			};
		},
		[ kind, type, id ]
	);

	return title ? decodeEntities( title ) : null;
}
