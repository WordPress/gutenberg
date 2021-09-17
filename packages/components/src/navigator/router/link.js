/**
 * WordPress dependencies
 */
import { createElement, forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import RouterContext from './router-context';
import {
	normalizeToLocation,
	resolveToLocation,
} from './utils/location-utils.js';

// React 15 compat
function isModifiedEvent( event ) {
	return !! (
		event.metaKey ||
		event.altKey ||
		event.ctrlKey ||
		event.shiftKey
	);
}

const LinkAnchor = forwardRef(
	(
		{
			innerRef, // TODO: deprecate
			navigate,
			onClick,
			...rest
		},
		forwardedRef
	) => {
		const { target } = rest;

		const props = {
			...rest,
			onClick: ( event ) => {
				try {
					if ( onClick ) onClick( event );
				} catch ( ex ) {
					event.preventDefault();
					throw ex;
				}

				if (
					! event.defaultPrevented && // onClick prevented default
					event.button === 0 && // ignore everything but left clicks
					( ! target || target === '_self' ) && // let browser handle "target=_blank" etc.
					! isModifiedEvent( event ) // ignore clicks with modifier keys
				) {
					event.preventDefault();
					navigate();
				}
			},
			ref: forwardedRef || innerRef,
		};

		/* eslint-disable-next-line jsx-a11y/anchor-has-content */
		return <a { ...props } />;
	}
);

/**
 * The public API for rendering a history-aware <a>.
 */
const Link = forwardRef(
	(
		{
			component = LinkAnchor,
			replace,
			to,
			innerRef, // TODO: deprecate
			...rest
		},
		forwardedRef
	) => {
		return (
			<RouterContext.Consumer>
				{ ( context ) => {
					const { history } = context;

					const location = normalizeToLocation(
						resolveToLocation( to, context.location ),
						context.location
					);

					let href = location ? history.createHref( location ) : '';
					if ( to ) {
						href = undefined;
					}
					const props = {
						...rest,
						href,
						navigate() {
							const resolvedLocation = resolveToLocation(
								to,
								context.location
							);
							const method = replace
								? history.replace
								: history.push;

							method( resolvedLocation );
						},
						ref: forwardedRef || innerRef,
					};

					return createElement( component, props );
				} }
			</RouterContext.Consumer>
		);
	}
);

export default Link;
