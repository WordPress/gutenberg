/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useHistory, useLocation } = unlock( routerPrivateApis );

export default function useGoToOverlayEditor() {
	const history = useHistory();
	const { path } = useLocation();

	function goToOverlayEditor( overlayId, navRef ) {
		history.navigate(
			addQueryArgs( path, {
				postId: overlayId,
				postType: 'wp_template_part',
				canvas: 'edit',
				myNavRef: navRef,
			} )
		);
	}

	return goToOverlayEditor;
}
