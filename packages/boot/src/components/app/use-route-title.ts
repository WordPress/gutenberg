import { useEffect, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore, type UnstableBase } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';
import { decodeEntities } from '@wordpress/html-entities';
import { privateApis as routePrivateApis } from '@wordpress/route';
import { unlock } from '../../lock-unlock';

const { useMatches } = unlock( routePrivateApis );

/**
 * Hook that manages document title updates based on route changes.
 * Formats titles with WordPress conventions and announces them to screen readers.
 *
 * The title is announced only when the route path and its title both change.
 * It is not announced on first load, when only the search params change
 * (search, filters, selection), or when another path keeps the same title.
 * The path and the title come from the same match, so the previous route's
 * title is not announced while the next route loads.
 *
 * This hook should be called from the Root component to ensure it runs on every route.
 */
export default function useRouteTitle() {
	const matches = useMatches();
	const currentMatch = matches[ matches.length - 1 ];
	const routeTitle = ( currentMatch?.loaderData as any )?.title as
		string | undefined;
	const routePath = currentMatch?.pathname;

	const siteTitle = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecord< UnstableBase >(
				'root',
				'__unstableBase'
			)?.name,
		[]
	);

	const lastRouteRef = useRef< { path?: string; title: string } | undefined >(
		undefined
	);

	useEffect( () => {
		if (
			routeTitle &&
			typeof routeTitle === 'string' &&
			siteTitle &&
			typeof siteTitle === 'string'
		) {
			// Decode entities for display
			const decodedRouteTitle = decodeEntities( routeTitle );
			const decodedSiteTitle = decodeEntities( siteTitle );

			// Format title following WordPress admin conventions
			const formattedTitle = sprintf(
				/* translators: Admin document title. 1: Admin screen name, 2: Site name. */
				__( '%1$s ‹ %2$s — WordPress' ),
				decodedRouteTitle,
				decodedSiteTitle
			);

			document.title = formattedTitle;

			// Announce title on route change for screen readers.
			const previous = lastRouteRef.current;
			lastRouteRef.current = {
				path: routePath,
				title: decodedRouteTitle,
			};
			if (
				decodedRouteTitle &&
				previous &&
				previous.path !== routePath &&
				previous.title !== decodedRouteTitle
			) {
				speak( decodedRouteTitle, 'assertive' );
			}
		}
	}, [ routeTitle, siteTitle, routePath ] );
}
