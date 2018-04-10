/**
 * Node dependencies
 */
import { join } from 'path';
import { URL } from 'url';

const {
	WP_BASE_URL = 'http://localhost:8888',
	WP_USERNAME = 'admin',
	WP_PASSWORD = 'password',
} = process.env;

const NAVIGATION_TIMEOUT = 20000;

function getUrl( WPPath, query = '' ) {
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

async function navigationTimeout( promise ) {
	await new Promise( ( resolve ) => {
		let resolved = false;
		const markResolvedAndResolve = () => {
			if ( ! resolved ) {
				resolve();
				resolved = true;
			}
		};
		setTimeout( markResolvedAndResolve, NAVIGATION_TIMEOUT );
		promise.then( markResolvedAndResolve );
	} );
}

async function goToWPPath( WPPath, query ) {
	await navigationTimeout( page.goto( getUrl( WPPath, query ), { timeout: 0 } ) );
}

async function login() {
	await page.type( '#user_login', WP_USERNAME );
	await page.type( '#user_pass', WP_PASSWORD );
	await page.click( '#wp-submit' );
	await navigationTimeout( page.waitForNavigation( { timeout: 0 } ) );
}

export async function visitAdmin( adminPath, query ) {
	await goToWPPath( join( 'wp-admin', adminPath ), query );

	if ( isWPPath( 'wp-login.php' ) ) {
		await login();
		return visitAdmin( adminPath, query );
	}
}

export async function newPost( query ) {
	await visitAdmin( 'post-new.php', query );
}

export async function newDesktopBrowserPage() {
	global.page = await browser.newPage();
	await page.setViewport( { width: 1000, height: 700 } );
}
