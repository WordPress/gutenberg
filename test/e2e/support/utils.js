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

function getUrl( ...WPPaths ) {
	const url = new URL( WP_BASE_URL );

	url.pathname = join( url.pathname, ...WPPaths );

	return url.href;
}

function isWPPath( ...WPPaths ) {
	const currentUrl = new URL( page.url() );

	currentUrl.search = '';

	return getUrl( ...WPPaths ) === currentUrl.href;
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

async function goToWPPath( ...WPPaths ) {
	await navigationTimeout( page.goto( getUrl( ...WPPaths ), { timeout: 0 } ) );
}

async function login() {
	await page.type( '#user_login', WP_USERNAME );
	await page.type( '#user_pass', WP_PASSWORD );
	await page.click( '#wp-submit' );
	await navigationTimeout( page.waitForNavigation( { timeout: 0 } ) );
}

export async function visitAdmin( adminPath ) {
	await goToWPPath( 'wp-admin', adminPath );

	if ( isWPPath( 'wp-login.php' ) ) {
		await login();
		return visitAdmin( adminPath );
	}
}

export async function newPost( postType ) {
	await visitAdmin( 'post-new.php' + ( postType ? '?post_type=' + postType : '' ) );
}

export async function newDesktopBrowserPage() {
	global.page = await browser.newPage();
	await page.setViewport( { width: 1000, height: 700 } );
}
