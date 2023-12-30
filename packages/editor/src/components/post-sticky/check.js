/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

export default function PostStickyCheck( { children } ) {
	const { hasStickyAction, postType } = useSelect( ( select ) => {
		const post = select( editorStore ).getCurrentPost();
		return {
			hasStickyAction: post._links?.[ 'wp:action-sticky' ] ?? false,
			postType: select( editorStore ).getCurrentPostType(),
		};
	}, [] );

	if ( postType !== 'post' || ! hasStickyAction ) {
		return null;
	}

	return children;
}
