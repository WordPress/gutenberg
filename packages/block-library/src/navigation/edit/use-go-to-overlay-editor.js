/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useHistory } = unlock( routerPrivateApis );

export default function useGoToOverlayEditor() {
	const history = useHistory();

	function goToOverlayEditor( overlayId, navRef ) {
		history.push( {
			postId: overlayId,
			postType: 'wp_template_part',
			canvas: 'edit',
			myNavRef: navRef,
		} );
	}

	return goToOverlayEditor;
}
