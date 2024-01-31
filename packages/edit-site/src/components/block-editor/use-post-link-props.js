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

export function usePostLinkProps() {
	const history = useHistory();

	return ( params, state ) => {
		return getPostLinkProps(
			history,
			{ ...params, focusMode: true, canvas: 'edit' },
			state
		);
	};
}
