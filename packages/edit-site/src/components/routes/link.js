/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { useHistory } from './index';

export function useLink( params = {}, state, shouldReplace = false ) {
	const history = useHistory();

	function onClick( event ) {
		event.preventDefault();

		if ( shouldReplace ) {
			history.replace( params, state );
		} else {
			history.push( params, state );
		}
	}

	return {
		href: addQueryArgs( window.location.href, params ),
		onClick,
	};
}

export default function Link( {
	params = {},
	state,
	replace: shouldReplace = false,
	children,
	...props
} ) {
	const { href, onClick } = useLink( params, state, shouldReplace );

	return (
		<a href={ href } onClick={ onClick } { ...props }>
			{ children }
		</a>
	);
}
