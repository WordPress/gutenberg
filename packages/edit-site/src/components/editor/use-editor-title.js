/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import useTitle from '../routes/use-title';
import { POST_TYPE_LABELS, TEMPLATE_POST_TYPE } from '../../utils/constants';
import { unlock } from '../../lock-unlock';

function useEditorTitle( postType, postId ) {
	const recordTitle = useSelect(
		( select ) => {
			const { getPostTitle } = unlock( select( editorStore ) );
			return getPostTitle( postType, postId );
		},
		[ postType, postId ]
	);
	let title;
	if ( recordTitle ) {
		title = sprintf(
			// translators: A breadcrumb trail for the Admin document title. %1$s: title of template being edited, %2$s: type of template (Template or Template Part).
			__( '%1$s ‹ %2$s' ),
			recordTitle,
			POST_TYPE_LABELS[ postType ] ??
				POST_TYPE_LABELS[ TEMPLATE_POST_TYPE ]
		);
	}

	// Only announce the title once the editor is ready to prevent "Replace"
	// action in <URLQueryController> from double-announcing.
	useTitle( title );
}

export default useEditorTitle;
