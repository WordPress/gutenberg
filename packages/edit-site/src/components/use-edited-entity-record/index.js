/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';
import { decodeEntities } from '@wordpress/html-entities';

export default function useEditedEntityRecord( postType, postId ) {
	const { record, title, description, isLoaded, icon } = useSelect(
		( select ) => {
			const { getEditedEntityRecord, hasFinishedResolution } =
				select( coreStore );
			const { __experimentalGetTemplateInfo: getTemplateInfo } =
				select( editorStore );
			const _record = getEditedEntityRecord(
				'postType',
				postType,
				postId
			);
			const _isLoaded =
				postId &&
				hasFinishedResolution( 'getEditedEntityRecord', [
					'postType',
					postType,
					postId,
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
