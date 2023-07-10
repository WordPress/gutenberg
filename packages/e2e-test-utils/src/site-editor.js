/**
 * WordPress dependencies
 */
import { canvas, visitAdminPage } from '@wordpress/e2e-test-utils';
import { addQueryArgs } from '@wordpress/url';

/**
 * @typedef {import('puppeteer-core').ElementHandle} ElementHandle
 */

const SELECTORS = {
	visualEditor: '.edit-site-visual-editor iframe',
	loadingSpinner: '.edit-site-canvas-spinner',
};

/**
 * Skips the welcome guide popping up to first time users of the site editor
 */
export async function disableSiteEditorWelcomeGuide() {
	await page.evaluate( () => {
		window.wp.data
			.dispatch( 'core/preferences' )
			.set( 'core/edit-site', 'welcomeGuide', false );

		window.wp.data
			.dispatch( 'core/preferences' )
			.set( 'core/edit-site', 'welcomeGuideStyles', false );

		window.wp.data
			.dispatch( 'core/preferences' )
			.set( 'core/edit-site', 'welcomeGuidePage', false );

		window.wp.data
			.dispatch( 'core/preferences' )
			.set( 'core/edit-site', 'welcomeGuideTemplate', false );
	} );
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
	await page.waitForSelector( SELECTORS.loadingSpinner, { hidden: true } );

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
	try {
		await page.waitForSelector(
			'.edit-site-visual-editor__editor-canvas[role="button"]',
			{ timeout: 3000 }
		);

		await canvas().click( 'body' );
	} catch {
		// This catch is necessary for the performance tests in old branches
		// where the site editor toggle was not implemented yet.
	}
}
