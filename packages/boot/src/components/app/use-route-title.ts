/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore, type UnstableBase } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';
import { decodeEntities } from '@wordpress/html-entities';
import { privateApis as routePrivateApis } from '@wordpress/route';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useLocation, useMatches } = unlock( routePrivateApis );

/**
 * Hook that manages document title updates based on route changes.
 * Formats titles with WordPress conventions and announces them to screen readers.
 *
 * This hook should be called from the Root component to ensure it runs on every route.
 */
export default function useRouteTitle() {
	const location = useLocation();
	const matches = useMatches();
	const currentMatch = matches[ matches.length - 1 ];
	const routeTitle = ( currentMatch?.loaderData as any )?.title as
		| string
		| undefined;

	const siteTitle = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecord< UnstableBase >(
				'root',
				'__unstableBase'
			)?.name,
		[]
	);

	const isInitialLocationRef = useRef( true );

	useEffect( () => {
		isInitialLocationRef.current = false;
	}, [ location ] );

	useEffect( () => {
		// Don't update or announce the title for initial page load.
		if ( isInitialLocationRef.current ) {
			return;
		}

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
			if ( decodedRouteTitle ) {
				speak( decodedRouteTitle, 'assertive' );
			}
		}
	}, [ routeTitle, siteTitle, location ] );
}
