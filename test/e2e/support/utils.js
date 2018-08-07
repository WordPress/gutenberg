/**
 * Node dependencies
 */
import { join } from 'path';
import { URL } from 'url';

/**
 * External dependencies
 */
import { times } from 'lodash';

const {
	WP_BASE_URL = 'http://localhost:8889',
	WP_USERNAME = 'admin',
	WP_PASSWORD = 'password',
} = process.env;

/**
 * Platform-specific modifier key.
 *
 * @see pressWithModifier
 *
 * @type {string}
 */
const MOD_KEY = process.platform === 'darwin' ? 'Meta' : 'Control';

/**
 * Regular expression matching zero-width space characters.
 *
 * @type {RegExp}
 */
const REGEXP_ZWSP = /[\u200B\u200C\u200D\uFEFF]/;

/**
 * Given an array of functions, each returning a promise, performs all
 * promises in sequence (waterfall) order.
 *
 * @param {Function[]} sequence Array of promise creators.
 *
 * @return {Promise} Promise resolving once all in the sequence complete.
 */
async function promiseSequence( sequence ) {
	return sequence.reduce(
		( current, next ) => current.then( next ),
		Promise.resolve()
	);
}

export function getUrl( WPPath, query = '' ) {
	const url = new URL( WP_BASE_URL );

	url.pathname = join( url.pathname, WPPath );
	url.search = query;

	return url.href;
}

function isWPPath( WPPath, query = '' ) {
	const currentUrl = new URL( page.url() );

	currentUrl.search = query;

	return getUrl( WPPath ) === currentUrl.href;
}

async function goToWPPath( WPPath, query ) {
	await page.goto( getUrl( WPPath, query ) );
}

async function login() {
	await page.type( '#user_login', WP_USERNAME );
	await page.type( '#user_pass', WP_PASSWORD );

	await Promise.all( [
		page.waitForNavigation(),
		page.click( '#wp-submit' ),
	] );
}

export async function visitAdmin( adminPath, query ) {
	await goToWPPath( join( 'wp-admin', adminPath ), query );

	if ( isWPPath( 'wp-login.php' ) ) {
		await login();
		return visitAdmin( adminPath, query );
	}
}

export async function newPost( { postType, enableTips = false } = {} ) {
	await visitAdmin( 'post-new.php', postType ? 'post_type=' + postType : '' );

	await page.evaluate( ( _enableTips ) => {
		const action = _enableTips ? 'enableTips' : 'disableTips';
		wp.data.dispatch( 'core/nux' )[ action ]();
	}, enableTips );

	if ( enableTips ) {
		await page.reload();
	}
}

export async function setViewport( type ) {
	const allowedDimensions = {
		large: { width: 960, height: 700 },
		small: { width: 600, height: 700 },
	};
	const currentDimmension = allowedDimensions[ type ];
	await page.setViewport( currentDimmension );
	await waitForPageDimensions( currentDimmension.width, currentDimmension.height );
}

/**
 * Function that waits until the page viewport has the required dimensions.
 * It is being used to address a problem where after using setViewport the execution may continue,
 * without the new dimensions being applied.
 * https://github.com/GoogleChrome/puppeteer/issues/1751
 *
 * @param {number} width  Width of the window.
 * @param {height} height Height of the window.
 */
export async function waitForPageDimensions( width, height ) {
	await page.mainFrame().waitForFunction(
		`window.innerWidth === ${ width } && window.innerHeight === ${ height }`
	);
}

export async function switchToEditor( mode ) {
	await page.click( '.edit-post-more-menu [aria-label="More"]' );
	const [ button ] = await page.$x( `//button[contains(text(), '${ mode } Editor')]` );
	await button.click( 'button' );
}

/**
 * Returns a promise which resolves with the edited post content (HTML string).
 *
 * @return {Promise} Promise resolving with post content markup.
 */
export async function getEditedPostContent() {
	const content = await page.evaluate( () => {
		const { select } = window.wp.data;
		return select( 'core/editor' ).getEditedPostContent();
	} );

	// Globally guard against zero-width characters.
	if ( REGEXP_ZWSP.test( content ) ) {
		throw new Error( 'Unexpected zero-width space character in editor content.' );
	}

	return content;
}

/**
 * Verifies that the edit post sidebar is opened, and if it is not, opens it.
 *
 * @return {Promise} Promise resolving once the edit post sidebar is opened.
 */
export async function ensureSidebarOpened() {
	// This try/catch flow relies on the fact that `page.$eval` throws an error
	// if the element matching the given selector does not exist. Thus, if an
	// error is thrown, it can be inferred that the sidebar is not opened.
	try {
		return page.$eval( '.edit-post-sidebar', () => {} );
	} catch ( error ) {
		return page.click( '.edit-post-header__settings [aria-label="Settings"]' );
	}
}

/**
 * Clicks the default block appender.
 */
export async function clickBlockAppender() {
	await expect( page ).toClick( '.editor-default-block-appender__content' );
}

/**
 * Search for block in the global inserter
 *
 * @param {string} searchTerm The text to search the inserter for.
 */
export async function searchForBlock( searchTerm ) {
	await page.click( '.edit-post-header [aria-label="Add block"]' );
	// Waiting here is necessary because sometimes the inserter takes more time to
	// render than Puppeteer takes to complete the 'click' action
	await page.waitForSelector( '.editor-inserter__menu' );
	await page.keyboard.type( searchTerm );
}

/**
 * Opens the inserter, searches for the given term, then selects the first
 * result that appears.
 *
 * @param {string} searchTerm The text to search the inserter for.
 * @param {string} panelName  The inserter panel to open (if it's closed by default).
 */
export async function insertBlock( searchTerm, panelName = null ) {
	await searchForBlock( searchTerm );
	if ( panelName ) {
		const panelButton = ( await page.$x( `//button[contains(text(), '${ panelName }')]` ) )[ 0 ];
		await panelButton.click();
	}
	await page.click( `button[aria-label="${ searchTerm }"]` );
}

/**
 * Performs a key press with modifier (Shift, Control, Meta, Mod), where "Mod"
 * is normalized to platform-specific modifier (Meta in MacOS, else Control).
 *
 * @param {string} modifier Modifier key.
 * @param {string} key      Key to press while modifier held.
 *
 * @return {Promise} Promise resolving when key combination pressed.
 */
export async function pressWithModifier( modifier, key ) {
	if ( modifier.toLowerCase() === 'mod' ) {
		modifier = MOD_KEY;
	}

	await page.keyboard.down( modifier );
	await page.keyboard.press( key );
	return page.keyboard.up( modifier );
}

/**
 * Clicks on More Menu item, searchers for the button with the text provided and clicks it.
 *
 * @param {string} buttonLabel The label to search the button for.
 */
export async function clickOnMoreMenuItem( buttonLabel ) {
	await expect( page ).toClick( '.edit-post-more-menu [aria-label="More"]' );
	const itemButton = ( await page.$x( `//button[contains(text(), '${ buttonLabel }')]` ) )[ 0 ];
	await itemButton.click( 'button' );
}

/**
 * Publishes the post, resolving once the request is complete (once a notice
 * is displayed).
 *
 * @return {Promise} Promise resolving when publish is complete.
 */
export async function publishPost() {
	// Opens the publish panel
	await page.click( '.editor-post-publish-panel__toggle' );

	// Disable reason: Wait for the animation to complete, since otherwise the
	// click attempt may occur at the wrong point.
	// eslint-disable-next-line no-restricted-syntax
	await page.waitFor( 100 );

	// Publish the post
	await page.click( '.editor-post-publish-button' );

	// A success notice should show up
	return page.waitForSelector( '.notice-success' );
}

/**
 * Given the clientId of a block, selects the block on the editor.
 *
 * @param {string} clientId Identified of the block.
 */
export async function selectBlockByClientId( clientId ) {
	await page.evaluate( ( id ) => {
		wp.data.dispatch( 'core/editor' ).selectBlock( id );
	}, clientId );
}

/**
 * Clicks on the button in the header which opens Document Settings sidebar when it is closed.
 */
export async function openDocumentSettingsSidebar() {
	const openButton = await page.$( '.edit-post-header__settings button[aria-label="Settings"][aria-expanded="false"]' );

	if ( openButton ) {
		await page.click( openButton );
	}
}

/**
 * Presses the given keyboard key a number of times in sequence.
 *
 * @param {string} key   Key to press.
 * @param {number} count Number of times to press.
 *
 * @return {Promise} Promise resolving when key presses complete.
 */
export async function pressTimes( key, count ) {
	return promiseSequence( times( count, () => () => page.keyboard.press( key ) ) );
}

export async function clearLocalStorage() {
	await page.evaluate( () => window.localStorage.clear() );
}

/**
 * Callback which automatically accepts dialog.
 *
 * @param {puppeteer.Dialog} dialog Dialog object dispatched by page via the 'dialog' event.
 */
async function acceptPageDialog( dialog ) {
	await dialog.accept();
}

/**
 * Enables even listener which accepts a page dialog which
 * may appear when navigating away from Gutenberg.
 */
export function enablePageDialogAccept() {
	page.on( 'dialog', acceptPageDialog );
}

/**
 * Disables even listener which accepts a page dialog which
 * may appear when navigating away from Gutenberg.
 */
export function disablePageDialogAccept() {
	page.removeListener( 'dialog', acceptPageDialog );
}
