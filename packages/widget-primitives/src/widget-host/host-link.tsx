import { forwardRef } from '@wordpress/element';
import type { ComponentPropsWithoutRef } from 'react';
import { useWidgetHost } from './widget-host';

interface HostLinkProps extends Omit<
	ComponentPropsWithoutRef< 'a' >,
	'href'
> {
	/**
	 * The link target. The host's `match` decides whether it names one of
	 * its own routes.
	 */
	href: string;
}

/**
 * Anchor that mounts the host router's link when the target is one of the
 * host's own routes, and a plain anchor otherwise. A `download`, or a
 * `_blank` target, keeps the plain anchor: a new document leaves the app.
 *
 * Composes through the `render` prop of a UI link, which merges its own
 * anchor props in.
 *
 * @param {HostLinkProps} props Component props.
 */
export const HostLink = forwardRef< HTMLAnchorElement, HostLinkProps >(
	function HostLink( { href, children, ...props }, ref ) {
		const { links } = useWidgetHost();
		const { download, target } = props;
		const opensNewDocument =
			( download !== undefined && download !== false ) ||
			/^_blank$/i.test( target ?? '' );
		const path = links && ! opensNewDocument ? links.match( href ) : null;

		if ( links && path !== null ) {
			return (
				<links.Link ref={ ref } path={ path } { ...props }>
					{ children }
				</links.Link>
			);
		}

		return (
			<a ref={ ref } href={ href } { ...props }>
				{ children }
			</a>
		);
	}
);
