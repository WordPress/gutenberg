import { useCallback, useEffect, useState } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as bootStore } from '@wordpress/boot';
import { useNavigate, useSearch } from '@wordpress/route';
import { useEditorAssets } from '@wordpress/lazy-editor';
import {
	SitePreview,
	useSiteUrl,
	type SitePreviewContext,
	type SitePreviewGlobalStyles,
} from '@wordpress/routes-site-preview';
import { usePreviewGlobalStyles } from '@wordpress/routes-site-preview/global-styles';

type ShellSiteProps = {
	/** Whether the site is the current route, rather than behind another. */
	isActive?: boolean;
	/** Whether the site's styles are being edited beside it. */
	isStyling?: boolean;
};

/**
 * Reports the global styles being edited, rendered for the site frame. A
 * separate component, so the editor assets the rendering needs only load
 * once styles are being edited.
 *
 * @param props          Component props.
 * @param props.onChange Called with the rendered styles.
 * @return Nothing.
 */
function EditedGlobalStyles( {
	onChange,
}: {
	onChange: ( globalStyles: SitePreviewGlobalStyles | undefined ) => void;
} ) {
	const { isReady } = useEditorAssets();
	const globalStyles = usePreviewGlobalStyles( { isEnabled: isReady } );

	useEffect( () => {
		onChange( globalStyles );
	}, [ globalStyles, onChange ] );

	useEffect( () => () => onChange( undefined ), [ onChange ] );

	return null;
}

function ShellSite( { isActive = true, isStyling = false }: ShellSiteProps ) {
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

	// While styling, and afterwards until they are saved, the site shows the
	// edited styles rather than the saved ones.
	const [ globalStyles, setGlobalStyles ] = useState<
		SitePreviewGlobalStyles | undefined
	>();
	const hasStyleEdits = useSelect( ( select ) => {
		const {
			__experimentalGetCurrentGlobalStylesId,
			hasEditsForEntityRecord,
		} = select( coreStore );
		const globalStylesId = __experimentalGetCurrentGlobalStylesId();
		return globalStylesId
			? hasEditsForEntityRecord( 'root', 'globalStyles', globalStylesId )
			: false;
	}, [] );

	if ( ! siteUrl ) {
		return null;
	}

	return (
		<>
			{ ( isStyling || hasStyleEdits ) && (
				<EditedGlobalStyles onChange={ setGlobalStyles } />
			) }
			<SitePreview
				siteUrl={ siteUrl }
				path={ path }
				onPathChange={ onPathChange }
				onContextChange={ onContextChange }
				globalStyles={ globalStyles }
				showAddressBar={ false }
			/>
		</>
	);
}

export const canvas = ShellSite;
