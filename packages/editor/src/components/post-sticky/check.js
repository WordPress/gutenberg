/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

/**
 * Wrapper component that renders its children only if post has a sticky action.
 *
 * @param {Object}  props          Props.
 * @param {Element} props.children Children to be rendered.
 *
 * @return {Component} The component to be rendered or null if post type is not 'post' or hasStickyAction is false.
 */
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
