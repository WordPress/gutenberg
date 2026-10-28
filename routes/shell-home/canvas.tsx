import { useCallback, useEffect, useState } from '@wordpress/element';
import { Fill } from '@wordpress/components';
import { useNavigate, useSearch } from '@wordpress/route';
import {
	SitePreview,
	useSiteUrl,
	type SitePreviewContext,
} from '@wordpress/routes-site-preview';
import EditActions from './edit-actions';

// The slot the site shell keeps in its bar for what the site shows.
const BAR_SLOT = 'SiteShellBarActions';

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
	useEffect( () => {
		if ( isActive && path && preview !== path ) {
			navigate( { to: '/', search: { preview: path }, replace: true } );
		}
	}, [ isActive, path, preview, navigate ] );

	const [ context, setContext ] = useState< SitePreviewContext | null >(
		null
	);

	const onPathChange = useCallback(
		( nextPath: string | undefined ) => {
			setPath( nextPath );
			if ( isActive ) {
				navigate( {
					to: '/',
					search: nextPath ? { preview: nextPath } : {},
					replace: true,
				} );
			}
		},
		[ isActive, navigate ]
	);

	if ( ! siteUrl ) {
		return null;
	}

	return (
		<>
			<SitePreview
				siteUrl={ siteUrl }
				path={ path }
				onPathChange={ onPathChange }
				onContextChange={ setContext }
				showAddressBar={ false }
			/>
			{ isActive && (
				<Fill name={ BAR_SLOT }>
					<EditActions
						context={ context }
						publicUrl={ context?.url || siteUrl }
					/>
				</Fill>
			) }
		</>
	);
}

export const canvas = ShellSite;
