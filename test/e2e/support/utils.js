/**
 * Node dependencies
 */
import path from 'path';
import url from 'url';

const BASE_URL = 'http://localhost:8888';
const USERNAME = 'admin';
const PASSWORD = 'password';

function getUrl( urlPath ) {
	return path.join( BASE_URL, urlPath );
}

function getCurrentPathName() {
	return url.parse( page.url() ).pathname;
}

async function gotoUrl( destUrl ) {
	return page.goto( destUrl );
}

async function login() {
	if ( getCurrentPathName() !== '/wp-login.php' ) {
		await gotoUrl( getUrl( 'wp-login.php' ) );
	}

	await page.type( '#user_login', USERNAME );
	await page.type( '#user_pass', PASSWORD );

	return Promise.all( [
		page.waitForNavigation(),
		page.click( '#wp-submit' ),
	] );
}

export async function visitAdmin( adminPath ) {
	await gotoUrl( path.join( BASE_URL, 'wp-admin', adminPath ) );
	if ( getCurrentPathName() === '/wp-login.php' ) {
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
