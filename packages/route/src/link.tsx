import type { ComponentProps, ForwardedRef } from 'react';
import { Link as RouterLink } from '@tanstack/react-router';
import { forwardRef } from '@wordpress/element';

/**
 * Link to a route. The link is active only when the current path is exactly
 * its `to` path.
 */
export const Link = forwardRef( function UnforwardedLink(
	{ activeOptions, ...props }: ComponentProps< typeof RouterLink >,
	ref: ForwardedRef< HTMLAnchorElement >
) {
	return (
		<RouterLink
			ref={ ref }
			// An active link gets `aria-current="page"`, which must not be on
			// links to parent pages.
			activeOptions={ { exact: true, ...activeOptions } }
			{ ...props }
		/>
	);
} ) as typeof RouterLink;
