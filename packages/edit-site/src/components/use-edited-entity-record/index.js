/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';

export default function useEditedEntityRecord( postType, postId ) {
	const { record, title, description, isLoaded, icon } = useSelect(
		( select ) => {
			const { getEditedPostType, getEditedPostId } =
				select( editSiteStore );
			const { getEditedEntityRecord, hasFinishedResolution } =
				select( coreStore );
			const { __experimentalGetTemplateInfo: getTemplateInfo } =
				select( editorStore );
			const usedPostType = postType ?? getEditedPostType();
			const usedPostId = postId ?? getEditedPostId();
			const _record = getEditedEntityRecord(
				'postType',
				usedPostType,
				usedPostId
			);
			const _isLoaded =
				usedPostId &&
				hasFinishedResolution( 'getEditedEntityRecord', [
					'postType',
					usedPostType,
					usedPostId,
				] );
			const templateInfo = getTemplateInfo( _record );

			return {
				record: _record,
				title: templateInfo.title,
				description: templateInfo.description,
				isLoaded: _isLoaded,
				icon: templateInfo.icon,
			};
		},
		[ postType, postId ]
	);

	return {
		isLoaded,
		icon,
		record,
		getTitle: () => ( title ? decodeEntities( title ) : null ),
		getDescription: () =>
			description ? decodeEntities( description ) : null,
	};
}
