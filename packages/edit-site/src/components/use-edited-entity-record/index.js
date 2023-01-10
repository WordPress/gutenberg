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

export default function useEditedEntityRecord() {
	const { record, title, isLoaded } = useSelect( ( select ) => {
		const { getEditedPostType, getEditedPostId } = select( editSiteStore );
		const { getEditedEntityRecord } = select( coreStore );
		const { __experimentalGetTemplateInfo: getTemplateInfo } =
			select( editorStore );
		const postType = getEditedPostType();
		const postId = getEditedPostId();
		const _record = getEditedEntityRecord( 'postType', postType, postId );
		const _isLoaded = !! postId;

		return {
			record: _record,
			title: getTemplateInfo( _record ).title,
			isLoaded: _isLoaded,
		};
	}, [] );

	return {
		isLoaded,
		record,
		getTitle: () => ( title ? decodeEntities( title ) : null ),
	};
}
