import { forwardRef, useMemo } from '@wordpress/element';
import { Link } from '@wordpress/route';
import { WidgetHostProvider } from '@wordpress/widget-primitives';
import type { WidgetHost } from '@wordpress/widget-primitives';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { matchDashboardHref } from './match-dashboard-href';

/*
 * Consumers mount this through render-prop composition, where the ref
 * carries the anchor to menu items and tooltip triggers; `forwardRef`
 * keeps that path unbroken.
 */
const DashboardRouteLink = forwardRef<
	HTMLAnchorElement,
	{ to: string } & ComponentPropsWithoutRef< 'a' >
>( function DashboardRouteLink( { to, ...props }, ref ) {
	return <Link ref={ ref } to={ to } { ...props } />;
} );

type DashboardWidgetHostProviderProps = {
	/**
	 * Subtree the dashboard capabilities apply to.
	 */
	children: ReactNode;
};

/**
 * Provides this route's host capabilities to the widgets it renders:
 * `links` recognizes hrefs that target this SPA's own routes and mounts
 * the router link for them.
 *
 * @param {DashboardWidgetHostProviderProps} props Component props.
 */
export function DashboardWidgetHostProvider( {
	children,
}: DashboardWidgetHostProviderProps ): React.ReactNode {
	const host = useMemo< WidgetHost >(
		() => ( {
			links: {
				match: matchDashboardHref,
				Link: DashboardRouteLink,
			},
		} ),
		[]
	);

	return <WidgetHostProvider value={ host }>{ children }</WidgetHostProvider>;
}
