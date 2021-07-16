/**
 * Internal dependencies
 */
import Link from './link';
import matchPath from './match-path';
import RouterContext from './router-context';
import { normalizeToLocation, resolveToLocation } from './utils/location-utils';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

function joinClassnames( ...classnames ) {
	return classnames.filter( ( i ) => i ).join( ' ' );
}

/**
 * A <Link> wrapper that knows if it's "active" or not.
 */
const NavLink = forwardRef(
	(
		{
			activeClassName = 'active',
			activeStyle,
			'aria-current': ariaCurrent = 'page',
			className: classNameProp,
			exact,
			innerRef,
			isActive: isActiveProp,
			location: locationProp,
			sensitive,
			strict,
			style: styleProp,
			to, // TODO: deprecate
			...rest
		},
		forwardedRef
	) => {
		return (
			<RouterContext.Consumer>
				{ ( context ) => {
					const currentLocation = locationProp || context.location;
					const toLocation = normalizeToLocation(
						resolveToLocation( to, currentLocation ),
						currentLocation
					);
					const { pathname: path } = toLocation;
					// Regex taken from: https://github.com/pillarjs/path-to-regexp/blob/master/index.js#L202
					const escapedPath =
						path &&
						path.replace( /([.+*?=^!:${}()[\]|/\\])/g, '\\$1' );

					const match = escapedPath
						? matchPath( currentLocation.pathname, {
								exact,
								path: escapedPath,
								sensitive,
								strict,
						  } )
						: null;
					const isActive = !! ( isActiveProp
						? isActiveProp( match, currentLocation )
						: match );

					const className = isActive
						? joinClassnames( classNameProp, activeClassName )
						: classNameProp;
					const style = isActive
						? { ...styleProp, ...activeStyle }
						: styleProp;

					const props = {
						'aria-current': ( isActive && ariaCurrent ) || null,
						className,
						style,
						to: toLocation,
						ref: forwardedRef || innerRef,
						...rest,
					};

					return <Link { ...props } to={ to } />;
				} }
			</RouterContext.Consumer>
		);
	}
);

export default NavLink;
