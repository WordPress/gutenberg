import { useNavigate, useSearch } from '@wordpress/route';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { useEditorAssets, useEditorSettings } from '@wordpress/lazy-editor';
import { Button, Spinner as WCSpinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useCallback, useEffect, useState } from '@wordpress/element';
import type { GlobalStylesConfig } from '@wordpress/global-styles-engine';
import { useGlobalStylesRevisions } from '@wordpress/global-styles-ui';
import { __ } from '@wordpress/i18n';
import { external } from '@wordpress/icons';
import { SitePreview, useSiteUrl } from '@wordpress/routes-site-preview';
import { unlock } from '@wordpress/routes-lock-unlock';
import { usePreviewGlobalStyles } from '@wordpress/routes-site-preview/global-styles';
import { getPreviewedStylesheet } from './previewed-theme';

const { StyleBookPreview } = unlock( editorPrivateApis );

// Rendered instead of the plain style book while a revision is selected in
// the revisions screen, so the style book previews that revision's styles
// rather than the current ones. A separate component so the revisions (and
// authors) are only fetched once a revision is actually selected.
function RevisionStyleBookPreview( {
	revisionId,
	section,
	onChangeSection,
	settings,
}: {
	revisionId: string;
	section: string;
	onChangeSection: ( updatedSection: string ) => void;
	settings: any;
} ) {
	const { revisions, isLoading } = useGlobalStylesRevisions();

	if ( isLoading ) {
		return null;
	}

	const selectedRevision = revisions.find(
		( revision: any ) => String( revision.id ) === revisionId
	);

	return (
		<StyleBookPreview
			path={ section }
			onPathChange={ onChangeSection }
			settings={ settings }
			userConfig={ selectedRevision }
		/>
	);
}

// Reports the selected revision of the revisions screen. A separate component
// so the revisions (and authors) are only fetched once one is selected.
function SelectedRevision( {
	revisionId,
	onChange,
}: {
	revisionId: string;
	onChange: ( revision: GlobalStylesConfig | undefined ) => void;
} ) {
	const { revisions, isLoading } = useGlobalStylesRevisions();
	const revision = isLoading
		? undefined
		: ( revisions.find(
				( item: { id: unknown } ) => String( item.id ) === revisionId
			) as unknown as GlobalStylesConfig | undefined );

	useEffect( () => {
		onChange( revision );
	}, [ revision, onChange ] );

	return null;
}

// The site's front end, browsable, with the global styles being edited (or
// the selected revision's) applied before they are saved.
function BrowsePreview() {
	const siteUrl = useSiteUrl();
	const navigate = useNavigate();
	const search = useSearch( { strict: false } ) as any;
	const { isReady: assetsReady } = useEditorAssets();

	const section = ( search.section ?? '/' ) as string;
	const revisionId = section.match( /^\/revisions\/(.+)$/ )?.[ 1 ];
	const [ revision, setRevision ] = useState< {
		id: string;
		config?: GlobalStylesConfig;
	} >();
	const onRevisionChange = useCallback(
		( config: GlobalStylesConfig | undefined ) => {
			if ( revisionId ) {
				setRevision( { id: revisionId, config } );
			}
		},
		[ revisionId ]
	);

	const globalStyles = usePreviewGlobalStyles( {
		isEnabled: assetsReady,
		userConfig:
			revisionId && revision?.id === revisionId
				? revision.config
				: undefined,
	} );

	// The previewed location is kept in the `url` search param, as `preview`
	// already toggles the style book.
	const onPathChange = useCallback(
		( path: string | undefined ) =>
			navigate( {
				search: { ...search, url: path },
				replace: true,
			} ),
		[ navigate, search ]
	);

	if ( ! siteUrl ) {
		return null;
	}

	// A previewed theme renders on the front end only for requests that
	// name it.
	const previewedStylesheet = getPreviewedStylesheet();

	return (
		<>
			{ revisionId && (
				<SelectedRevision
					revisionId={ revisionId }
					onChange={ onRevisionChange }
				/>
			) }
			<SitePreview
				siteUrl={ siteUrl }
				path={ search.url }
				onPathChange={ onPathChange }
				queryArgs={
					previewedStylesheet
						? { wp_theme_preview: previewedStylesheet }
						: undefined
				}
				globalStyles={ globalStyles }
				renderActions={
					// The public site shows the active theme, not the
					// previewed one.
					previewedStylesheet
						? undefined
						: ( { publicUrl } ) => (
								<Button
									size="compact"
									icon={ external }
									label={ __( 'View' ) }
									onClick={ () =>
										window.open(
											publicUrl,
											'_blank',
											'noopener'
										)
									}
								/>
							)
				}
			/>
		</>
	);
}

function StyleBookCanvas() {
	const { isReady: assetsReady } = useEditorAssets();
	const navigate = useNavigate();
	const search = useSearch( { strict: false } ) as any;
	const { globalStylesId, isBlockTheme } = useSelect( ( select ) => {
		const { getCurrentTheme, __experimentalGetCurrentGlobalStylesId } =
			select( coreStore ) as any;
		return {
			globalStylesId: __experimentalGetCurrentGlobalStylesId(),
			isBlockTheme: !! getCurrentTheme()?.is_block_theme,
		};
	}, [] );
	// The style book reads the theme's colors and typography from the editor
	// settings. It cannot fall back to the editor store here, because on this
	// route nothing mounts the editor that would populate it.
	const { isReady: settingsReady, editorSettings } = useEditorSettings( {
		stylesId: globalStylesId,
	} );

	// Get section from URL query params
	const section = ( search.section ?? '/' ) as string;

	const onChangeSection = ( updatedSection: string ) => {
		navigate( {
			search: {
				...search,
				section: updatedSection,
			},
		} );
	};

	// Settings are awaited as well as assets: an unresolved `editorSettings` is
	// still an object, so it would suppress the style book's own fallback and
	// render a first pass with no theme styles.
	if ( ! assetsReady || ! settingsReady ) {
		return (
			<div
				style={ {
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					height: '100%',
				} }
			>
				<WCSpinner />
			</div>
		);
	}

	// On classic themes the style book is the whole route: there is no styles
	// UI for a selected section to drive, so its sections aren't clickable.
	if ( ! isBlockTheme ) {
		return <StyleBookPreview isStatic settings={ editorSettings } />;
	}

	const revisionId = section.match( /^\/revisions\/(.+)$/ )?.[ 1 ];
	if ( revisionId ) {
		return (
			<RevisionStyleBookPreview
				revisionId={ revisionId }
				section={ section }
				onChangeSection={ onChangeSection }
				settings={ editorSettings }
			/>
		);
	}

	return (
		<StyleBookPreview
			path={ section }
			onPathChange={ onChangeSection }
			settings={ editorSettings }
		/>
	);
}

function Canvas() {
	const search = useSearch( { strict: false } ) as any;
	const isBlockTheme = useSelect(
		( select ) => !! select( coreStore ).getCurrentTheme()?.is_block_theme,
		[]
	);

	if ( isBlockTheme && search.preview !== 'stylebook' ) {
		return <BrowsePreview />;
	}

	return <StyleBookCanvas />;
}

export const canvas = Canvas;
