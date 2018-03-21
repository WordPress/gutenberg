/* global page */
import path from 'path';
import url from 'url';

// Config
const BASE_URL = 'http://localhost:8888';
const USERNAME = 'admin';
const PASSWORD = 'password';

function getUrl( urlPath ) {
	return path.join( BASE_URL, urlPath );
}

function getCurrentPathName() {
	return url.parse( page.url() ).pathname;
}

async function login() {
	if ( getCurrentPathName() !== '/wp-login.php' ) {
		await page.goto( getUrl( 'wp-login.php' ) );
	}

	await page.type( '#user_login', USERNAME );
	await page.type( '#user_pass', PASSWORD );
	await page.click( '#wp-submit' );
	return page.waitForNavigation();
}

export async function visitAdmin( adminPath ) {
	await page.goto( path.join( BASE_URL, 'wp-admin', adminPath ) );
	if ( getCurrentPathName() === '/wp-login.php' ) {
		await login();
		return visitAdmin( adminPath );
	}
}

export async function newPost() {
	await visitAdmin( 'post-new.php' );
}
