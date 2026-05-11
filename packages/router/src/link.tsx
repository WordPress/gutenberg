/**
 * WordPress dependencies
 */
import { useContext, useMemo } from '@wordpress/element';
import { getQueryArgs, getPath, buildQueryString } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { ConfigContext, type NavigationOptions, useHistory } from './router';

export function useLink( to: string, options: NavigationOptions = {} ) {
	const history = useHistory();
	const { pathArg, beforeNavigate } = useContext( ConfigContext );
	function onClick( event: React.SyntheticEvent< HTMLAnchorElement > ) {
		event?.preventDefault();
		history.navigate( to, options );
	}
	const query = getQueryArgs( to );
	const path = getPath( 'http://domain.com/' + to ) ?? '';
	const link = useMemo( () => {
		return beforeNavigate
			? beforeNavigate( { path, query } )
			: { path, query };
	}, [ path, query, beforeNavigate ] );

	const [ before ] = window.location.href.split( '?' );

	return {
		href: `${ before }?${ buildQueryString( {
			[ pathArg ]: link.path,
			...link.query,
		} ) }`,
		onClick,
	};
}

export function Link( {
	to,
	options,
	children,
	...props
}: {
	to: string;
	options?: NavigationOptions;
	children: React.ReactNode;
} ) {
	const { href, onClick } = useLink( to, options );

	return (
		<a href={ href } onClick={ onClick } { ...props }>
			{ children }
		</a>
	);
}
