/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

export default function PostURLCheck( { children } ) {
	const isVisible = useSelect( ( select ) => {
		const postTypeSlug = select( editorStore ).getCurrentPostType();
		const postType = select( coreStore ).getPostType( postTypeSlug );
		if ( ! postType?.viewable ) {
			return false;
		}

		const post = select( editorStore ).getCurrentPost();
		if ( ! post.link ) {
			return false;
		}

		const permalinkParts = select( editorStore ).getPermalinkParts();
		if ( ! permalinkParts ) {
			return false;
		}

		return true;
	}, [] );

	if ( ! isVisible ) {
		return null;
	}

	return children;
}
