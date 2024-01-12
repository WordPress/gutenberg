/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { getPostLinkProps } from '../routes/link';

const { useHistory } = unlock( routerPrivateApis );

export function usePostNavigation() {
	const history = useHistory();

	const getPostNavigation = ( params, state ) => {
		const { href, onClick } = getPostLinkProps( history, params, state );

		return {
			link: href,
			goTo: ( event ) => onClick( event ),
		};
	};

	return {
		getPostNavigation,
		goBack: history.back,
	};
}
