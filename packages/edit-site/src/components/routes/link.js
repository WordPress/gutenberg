/**
 * WordPress dependencies
 */
import { addQueryArgs, getQueryArgs, removeQueryArgs } from '@wordpress/url';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import {
	isPreviewingTheme,
	currentlyPreviewingTheme,
} from '../../utils/is-previewing-theme';

const { useHistory } = unlock( routerPrivateApis );

export function getPostLinkProps(
	history,
	params = {},
	state,
	shouldReplace = false
) {
	function onClick( event ) {
		event?.preventDefault();

		if ( shouldReplace ) {
			history.replace( params, state );
		} else {
			history.push( params, state );
		}
	}

	const currentArgs = getQueryArgs( window.location.href );
	const currentUrlWithoutArgs = removeQueryArgs(
		window.location.href,
		...Object.keys( currentArgs )
	);

	if ( isPreviewingTheme() ) {
		params = {
			...params,
			wp_theme_preview: currentlyPreviewingTheme(),
		};
	}

	const newUrl = addQueryArgs( currentUrlWithoutArgs, params );

	return {
		href: newUrl,
		onClick,
	};
}

export function useLink( params, state, shouldReplace ) {
	const history = useHistory();
	return getPostLinkProps( history, params, state, shouldReplace );
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
