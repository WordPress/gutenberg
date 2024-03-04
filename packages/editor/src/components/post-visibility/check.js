/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

export default function PostVisibilityCheck( { render } ) {
	const canEdit = useSelect( ( select ) => {
		return (
			select( editorStore ).getCurrentPost()._links?.[
				'wp:action-publish'
			] ?? false
		);
	} );

	return render( { canEdit } );
}
