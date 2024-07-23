/**
 * WordPress dependencies
 */
import { addQueryArgs, getQueryArgs, removeQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import {
	isPreviewingTheme,
	currentlyPreviewingTheme,
} from './is-previewing-theme';
import { useHistory } from './router';

export function useLink( params, state, shouldReplace = false ) {
	const history = useHistory();
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

	// TODO:
	// This makes sure that the new HREF still contains the theme preview arg,
	// but the history won't have it. Isn't that an issue?
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
