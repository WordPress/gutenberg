/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useHistory } = unlock( routerPrivateApis );

export function useRouter() {
	const history = useHistory();

	const goMethods = useMemo( () => {
		const goTo = ( p ) => {
			history.push( { path: p } );
		};

		return { goTo };
	}, [ history ] );

	return useMemo(
		() => ( {
			location: { isBack: false, isInitial: false, skipFocus: false },
			...goMethods,
		} ),
		[ goMethods ]
	);
}
