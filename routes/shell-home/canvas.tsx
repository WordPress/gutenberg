import { useCallback, useEffect, useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { store as bootStore } from '@wordpress/boot';
import { useNavigate, useSearch } from '@wordpress/route';
import {
	SitePreview,
	useSiteUrl,
	type SitePreviewContext,
} from '@wordpress/routes-site-preview';

type ShellSiteProps = {
	/** Whether the site is the current route, rather than behind another. */
	isActive?: boolean;
};

function ShellSite( { isActive = true }: ShellSiteProps ) {
	const siteUrl = useSiteUrl();
	const navigate = useNavigate();
	const { preview } = useSearch( { strict: false } ) as {
		preview?: unknown;
	};

	// The frame stays mounted while other routes open above it, and those
	// routes have no `preview` param. So the location lives here, and the
	// param only mirrors it while the site is the current route.
	const [ path, setPath ] = useState< string | undefined >( () =>
		typeof preview === 'string' ? preview : undefined
	);

	// Follow a location given from outside, such as history navigation.
	useEffect( () => {
		if ( typeof preview === 'string' ) {
			setPath( preview );
		}
	}, [ preview ] );

	// Returning to the site restores the param for the location it shows.
	// Keeping the param in step changes nothing on screen, so it starts no
	// transition, which would otherwise cut short the one already running.
	useEffect( () => {
		if ( isActive && path && preview !== path ) {
			navigate( {
				to: '/',
				search: { preview: path },
				replace: true,
				viewTransition: false,
			} );
		}
	}, [ isActive, path, preview, navigate ] );

	// The shell's bar names what the site shows and offers to edit it.
	const { setShownEntity } = useDispatch( bootStore );
	const onContextChange = useCallback(
		( context: SitePreviewContext | null ) => setShownEntity( context ),
		[ setShownEntity ]
	);

	const onPathChange = useCallback(
		( nextPath: string | undefined ) => {
			setPath( nextPath );
			if ( isActive ) {
				navigate( {
					to: '/',
					search: nextPath ? { preview: nextPath } : {},
					replace: true,
					viewTransition: false,
				} );
			}
		},
		[ isActive, navigate ]
	);

	if ( ! siteUrl ) {
		return null;
	}

	return (
		<SitePreview
			siteUrl={ siteUrl }
			path={ path }
			onPathChange={ onPathChange }
			onContextChange={ onContextChange }
			showAddressBar={ false }
		/>
	);
}

export const canvas = ShellSite;
