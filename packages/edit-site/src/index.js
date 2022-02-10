/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import {
	registerCoreBlocks,
	__experimentalRegisterExperimentalCoreBlocks,
} from '@wordpress/block-library';
import { dispatch, select } from '@wordpress/data';
import { render, unmountComponentAtNode } from '@wordpress/element';
import {
	__experimentalFetchLinkSuggestions as fetchLinkSuggestions,
	__experimentalFetchUrlData as fetchUrlData,
} from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { store as viewportStore } from '@wordpress/viewport';
import { getQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import './hooks';
import { store as editSiteStore } from './store';
import EditSiteApp from './components/app';
import getIsListPage from './utils/get-is-list-page';
import redirectToHomepage from './components/routes/redirect-to-homepage';
import ErrorBoundaryWarning from './components/error-boundary/warning';

/**
 * Reinitializes the editor after the user chooses to reboot the editor after
 * an unhandled error occurs, replacing previously mounted editor element using
 * an initial state from prior to the crash.
 *
 * @param {Element} target   DOM node in which editor is rendered.
 * @param {?Object} settings Editor settings object.
 */
export async function reinitializeEditor( target, settings ) {
	// The site editor relies on `postType` and `postId` params in the URL to
	// define what's being edited. When visiting via the dashboard link, these
	// won't be present. Do a client side redirect to the 'homepage' if that's
	// the case.
	try {
		await redirectToHomepage( settings.siteUrl );
	} catch ( error ) {
		render(
			<ErrorBoundaryWarning
				message={ __(
					'The editor is unable to find a block template for the homepage.'
				) }
				error={ error }
				reboot={ () => reinitializeEditor( target, settings ) }
				dashboardLink="index.php"
			/>,
			target
		);
		return;
	}

	// This will be a no-op if the target doesn't have any React nodes.
	unmountComponentAtNode( target );
	const reboot = reinitializeEditor.bind( null, target, settings );

	// We dispatch actions and update the store synchronously before rendering
	// so that we won't trigger unnecessary re-renders with useEffect.
	{
		dispatch( editSiteStore ).updateSettings( settings );

		// Keep the defaultTemplateTypes in the core/editor settings too,
		// so that they can be selected with core/editor selectors in any editor.
		// This is needed because edit-site doesn't initialize with EditorProvider,
		// which internally uses updateEditorSettings as well.
		dispatch( editorStore ).updateEditorSettings( {
			defaultTemplateTypes: settings.defaultTemplateTypes,
			defaultTemplatePartAreas: settings.defaultTemplatePartAreas,
		} );

		const isLandingOnListPage = getIsListPage(
			getQueryArgs( window.location.href )
		);

		if ( isLandingOnListPage ) {
			// Default the navigation panel to be opened when we're in a bigger
			// screen and land in the list screen.
			dispatch( editSiteStore ).setIsNavigationPanelOpened(
				select( viewportStore ).isViewportMatch( 'medium' )
			);
		}
	}

	render( <EditSiteApp reboot={ reboot } />, target );
}

/**
 * Initializes the site editor screen.
 *
 * @param {string} id       ID of the root element to render the screen in.
 * @param {Object} settings Editor settings.
 */
export function initializeEditor( id, settings ) {
	settings.__experimentalFetchLinkSuggestions = ( search, searchOptions ) =>
		fetchLinkSuggestions( search, searchOptions, settings );
	settings.__experimentalFetchRichUrlData = fetchUrlData;
	settings.__experimentalSpotlightEntityBlocks = [ 'core/template-part' ];

	const target = document.getElementById( id );

	dispatch( blocksStore ).__experimentalReapplyBlockTypeFilters();
	registerCoreBlocks();
	if ( process.env.IS_GUTENBERG_PLUGIN ) {
		__experimentalRegisterExperimentalCoreBlocks( {
			enableFSEBlocks: true,
		} );
	}

	reinitializeEditor( target, settings );
}

export { default as __experimentalMainDashboardButton } from './components/main-dashboard-button';
export { default as __experimentalNavigationToggle } from './components/navigation-sidebar/navigation-toggle';
export { default as PluginSidebar } from './components/sidebar/plugin-sidebar';
export { default as PluginSidebarMoreMenuItem } from './components/header/plugin-sidebar-more-menu-item';
export { default as PluginMoreMenuItem } from './components/header/plugin-more-menu-item';
