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

export function useChangeEntity() {
	const history = useHistory();

	const getEntityLoader = ( params, state ) => {
		const { href, onClick } = getPostLinkProps( history, params, state );

		return {
			href,
			loadEntity: ( event ) => onClick( event ),
		};
	};

	return {
		getEntityLoader,
		goBack: history.back,
	};
}
