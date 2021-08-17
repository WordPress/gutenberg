/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

export function PostStickyCheck( { hasStickyAction, postType, children } ) {
	if ( postType !== 'post' || ! hasStickyAction ) {
		return null;
	}

	return children;
}

export default compose( [
	withSelect( ( select ) => {
		const post = select( editorStore ).getCurrentPost();
		return {
			hasStickyAction: get(
				post,
				[ '_links', 'wp:action-sticky' ],
				false
			),
			postType: select( editorStore ).getCurrentPostType(),
		};
	} ),
] )( PostStickyCheck );
