/**
 * WordPress dependencies
 */
import { visitAdminPage } from '@wordpress/e2e-test-utils';
import { addQueryArgs } from '@wordpress/url';

/**
 * @typedef {import('puppeteer-core').ElementHandle} ElementHandle
 */

const SELECTORS = {
	visualEditor: '.edit-site-visual-editor iframe',
};

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
		...query,
	} ).slice( 1 );

	await visitAdminPage( 'site-editor.php', query );
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
		'.edit-site-header-edit-mode__actions button[aria-label="Styles"]'
	);
}

/**
 * Opens a global styles panel.
 *
 * @param {string} panelName Name of the panel that is going to be opened.
 */
export async function openGlobalStylesPanel( panelName ) {
	const selector = `//div[@aria-label="Editor settings"]//button[.//*[text()="${ panelName }"]]`;
	await ( await page.waitForXPath( selector ) ).click();
}

/**
 * Opens the previous global styles panel.
 */
export async function openPreviousGlobalStylesPanel() {
	await page.click(
		'div[aria-label="Editor settings"] button[aria-label="Navigate to the previous view"]'
	);
}

/**
 * Enters edit mode.
 */
export async function enterEditMode() {
	const editSiteToggle = await page.$( '.edit-site-site-hub__edit-button' );
	// This check is necessary for the performance tests in old branches
	// where the site editor toggle was not implemented yet.
	if ( ! editSiteToggle ) {
		return;
	}
	await page.click( '.edit-site-site-hub__edit-button' );
}
