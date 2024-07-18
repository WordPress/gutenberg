/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

/**
 * Wrapper component that renders its children only if post has a publish action.
 *
 * @param {Object}  props          Props.
 * @param {Element} props.children Children to be rendered.
 *
 * @return {Component} - The component to be rendered or null if there is no publish action.
 */
export default function PostScheduleCheck( { children } ) {
	const hasPublishAction = useSelect( ( select ) => {
		return (
			select( editorStore ).getCurrentPost()._links?.[
				'wp:action-publish'
			] ?? false
		);
	}, [] );

	if ( ! hasPublishAction ) {
		return null;
	}

	return children;
}
