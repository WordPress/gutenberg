/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

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
