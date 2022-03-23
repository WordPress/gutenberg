/**
 * WordPress dependencies
 */
import { visitAdminPage } from '@wordpress/e2e-test-utils';
import { addQueryArgs } from '@wordpress/url';

/**
 * @typedef {import('puppeteer-core').ElementHandle} ElementHandle
 */

const SELECTORS = {
	navigationPanel: {
		backToDashboard:
			'.edit-site-navigation-panel .edit-site-navigation-panel__back-to-dashboard',
		goBack: '.components-navigation__back-button',
		isOpenState: '.edit-site-navigation-toggle.is-open',
		menuItem: ( label ) =>
			`//div[contains(@class, "edit-site-navigation-panel")]//button[.//*[text()="${ label }"]]`,
		open: '.edit-site-navigation-toggle__button',
		panelContainer: '.edit-site-navigation-panel',
	},
	visualEditor: '.edit-site-visual-editor iframe',
};

/**
 * Searches for an item in the navigation panel with the label provided and clicks it.
 *
 * @param {string} label The label to search the menu item for.
 */
export async function clickSiteEditorMenuItem( label ) {
	const item = await getSiteEditorMenuItem( label );

	if ( item ) {
		await item.click();
	} else {
		throw new Error(
			`Navigation item with label ${ label } was not found.`
		);
	}
}

/**
 * Closes the site editor navigation panel if open
 */
export async function closeSiteEditorNavigationPanel() {
	const { navigationPanel } = SELECTORS;

	const isOpen = !! ( await page.$( navigationPanel.isOpenState ) );

	if ( isOpen ) {
		await page.click( navigationPanel.open );
		await page.waitForSelector( navigationPanel.panelContainer, {
			hidden: true,
		} );
	}
}

/**
 * Skips the welcome guide popping up to first time users of the site editor
 */
export async function disableSiteEditorWelcomeGuide() {
	// This code prioritizes using the preferences store. However, performance
	// tests run on older versions of the codebase where the preferences store
	// doesn't exist. Some backwards compatibility has been built-in so that
	// those tests continue to work there. This can be removed once WordPress
	// 6.0 is released, as the older version used by the performance tests will
	// then include the preferences store.
	// See https://github.com/WordPress/gutenberg/pull/39300.
	const isWelcomeGuideActive = await page.evaluate( () => {
		// TODO - remove if statement after WordPress 6.0 is released.
		if ( ! wp.data.select( 'core/preferences' ) ) {
			return wp.data
				.select( 'core/edit-site' )
				.isFeatureActive( 'welcomeGuide' );
		}

		return !! wp.data
			.select( 'core/preferences' )
			?.get( 'core/edit-site', 'welcomeGuide' );
	} );
	const isWelcomeGuideStyesActive = await page.evaluate( () => {
		// TODO - remove if statement after WordPress 6.0 is released.
		if ( ! wp.data.select( 'core/preferences' ) ) {
			return wp.data
				.select( 'core/edit-site' )
				.isFeatureActive( 'welcomeGuideStyles' );
		}

		return !! wp.data
			.select( 'core/preferences' )
			?.get( 'core/edit-site', 'welcomeGuideStyles' );
	} );

	if ( isWelcomeGuideActive ) {
		await page.evaluate( () => {
			// TODO - remove if statement after WordPress 6.0 is released.
			if ( ! wp.data.dispatch( 'core/preferences' ) ) {
				wp.data
					.dispatch( 'core/edit-site' )
					.toggleFeature( 'welcomeGuide' );
				return;
			}

			wp.data
				.dispatch( 'core/preferences' )
				.toggle( 'core/edit-site', 'welcomeGuide' );
		} );
	}

	if ( isWelcomeGuideStyesActive ) {
		await page.evaluate( () => {
			// TODO - remove if statement after WordPress 6.0 is released.
			if ( ! wp.data.dispatch( 'core/preferences' ) ) {
				wp.data
					.dispatch( 'core/edit-site' )
					.toggleFeature( 'welcomeGuideStyles' );
				return;
			}
			wp.data
				.dispatch( 'core/preferences' )
				.toggle( 'core/edit-site', 'welcomeGuideStyles' );
		} );
	}
}

/**
 * Returns a promise which resolves with the edited post content (HTML string).
 *
 * @return {Promise<string>} Promise resolving with post content markup.
 */
export function getCurrentSiteEditorContent() {
	return page.evaluate( () => {
		const postId = window.wp.data
			.select( 'core/edit-site' )
			.getEditedPostId();
		const postType = window.wp.data
			.select( 'core/edit-site' )
			.getEditedPostType();
		const record = window.wp.data
			.select( 'core' )
			.getEditedEntityRecord( 'postType', postType, postId );
		if ( record ) {
			if ( typeof record.content === 'function' ) {
				return record.content( record );
			} else if ( record.blocks ) {
				return window.wp.blocks.__unstableSerializeAndClean(
					record.blocks
				);
			} else if ( record.content ) {
				return record.content;
			}
		}
		return '';
	} );
}

/**
 * Searches for an item in the site editor navigation menu with the provided label.
 *
 * @param {string} label The label to search the menu item for.
 *
 * @return {Promise<?ElementHandle>} The menu item handle or `null`
 */
export async function getSiteEditorMenuItem( label ) {
	const { navigationPanel } = SELECTORS;

	const item = await page.waitForXPath( navigationPanel.menuItem( label ), {
		visible: true,
	} );

	return item;
}

/**
 * Returns `true` if in the site editor navigation root
 *
 * Checks whether the “Back to dashboard” button is visible. If
 * not in the root, a “Back” button would be visible instead.
 *
 * @return {Promise<boolean>} Whether it currently is the navigation root or not
 */
export async function isSiteEditorRoot() {
	const { navigationPanel } = SELECTORS;

	const isBackToDashboardButtonVisible = !! ( await page.$(
		navigationPanel.backToDashboard
	) );

	return isBackToDashboardButtonVisible;
}

/**
 * Navigates the site editor back
 */
export async function navigateSiteEditorBack() {
	const { navigationPanel } = SELECTORS;

	await page.click( navigationPanel.goBack );
}

/**
 * Goes back until it gets to the root
 */
export async function navigateSiteEditorBackToRoot() {
	while ( ! ( await isSiteEditorRoot() ) ) {
		await navigateSiteEditorBack();
	}
}

/**
 * Opens the site editor navigation panel if closed
 */
export async function openSiteEditorNavigationPanel() {
	const { navigationPanel } = SELECTORS;

	const isOpen = !! ( await page.$( navigationPanel.isOpenState ) );

	if ( ! isOpen ) {
		await page.click( navigationPanel.open );
		await page.waitForSelector( navigationPanel.panelContainer );
	}
}

/**
 * Navigates through a sequence of links in the site editor navigation panel
 *
 * @param {string[] | string} labels Labels to navigate through
 */
export async function siteEditorNavigateSequence( labels ) {
	if ( ! Array.isArray( labels ) ) {
		labels = [ labels ];
	}

	for ( const label of labels ) {
		await clickSiteEditorMenuItem( label );
	}
}

/**
 * Visits the Site Editor main page
 *
 * By default, it also skips the welcome guide. The option can be disabled if need be.
 *
 * @see disableSiteEditorWelcomeGuide
 *
 * @param {string}  query                   String to be serialized as query portion of URL.
 * @param {boolean} [skipWelcomeGuide=true] Whether to skip the welcome guide as part of the navigation.
 */
export async function visitSiteEditor( query, skipWelcomeGuide = true ) {
	query = addQueryArgs( '', {
		page: 'gutenberg-edit-site',
		...query,
	} ).slice( 1 );

	await visitAdminPage( 'themes.php', query );
	await page.waitForSelector( SELECTORS.visualEditor );

	if ( skipWelcomeGuide ) {
		await disableSiteEditorWelcomeGuide();
	}
}

/**
 * Toggles the global styles sidebar (opens it if closed and closes it if open).
 */
export async function toggleGlobalStyles() {
	await page.click(
		'.edit-site-header__actions button[aria-label="Styles"]'
	);
}

/**
 * Opens a global styles panel.
 *
 * @param {string} panelName Name of the panel that is going to be opened.
 */
export async function openGlobalStylesPanel( panelName ) {
	const selector = `//div[@aria-label="Settings"]//button[.//*[text()="${ panelName }"]]`;
	await ( await page.waitForXPath( selector ) ).click();
}

/**
 * Opens the previous global styles panel.
 */
export async function openPreviousGlobalStylesPanel() {
	await page.click(
		'div[aria-label="Settings"] button[aria-label="Navigate to the previous view"]'
	);
}
