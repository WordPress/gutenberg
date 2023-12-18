/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useLocation } = unlock( routerPrivateApis );

export default function useInitEditedEntityFromURL() {
	const { params = {} } = useLocation();
	return { postId: params.post, postType: params.postType };
}
