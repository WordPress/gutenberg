/* eslint-env jest */
/* global page, browser */

const path = require( 'path' );
const url = require( 'url' );
const puppeteer = require( 'puppeteer' );

// Config

const BASE_URL = 'http://localhost:8888';
const USERNAME = 'admin';
const PASSWORD = 'password';

// Global Setup

beforeAll( async () => {
	global.browser = await puppeteer.launch();
	global.page = await browser.newPage();
} );

afterAll( async () => {
	await browser.close();
} );

// Utilities

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

async function visitAdmin( adminPath ) {
	await page.goto( path.join( BASE_URL, 'wp-admin', adminPath ) );
	if ( getCurrentPathName() === '/wp-login.php' ) {
		await login();
		return visitAdmin( adminPath );
	}
}

async function newPost() {
	await visitAdmin( 'post-new.php' );
}

// Tests

describe( 'a11y', () => {
	beforeAll( async () => {
		await newPost();
	} );

	it( 'tabs header bar', async () => {
		await page.keyboard.down( 'Control' );
		await page.keyboard.press( '~' );
		await page.keyboard.up( 'Control' );

		await page.keyboard.press( 'Tab' );

		const isFocusedToggle = await page.$eval( ':focus', ( focusedElement ) => {
			return focusedElement.classList.contains( 'editor-inserter__toggle' );
		} );

		expect( isFocusedToggle ).toBe( true );
	} );
} );
