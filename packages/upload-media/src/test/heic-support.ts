/**
 * Internal dependencies
 */
import {
	getHeicConversionAdvice,
	getHeicUnsupportedMessage,
} from '../heic-support';

const FIREFOX_MAC =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:128.0) Gecko/20100101 Firefox/128.0';
const FIREFOX_WINDOWS =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0';
const FIREFOX_LINUX =
	'Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0';
const SAFARI_MAC =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
const CHROME_MAC =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const CHROME_WINDOWS =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const EDGE_WINDOWS =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0';
const CHROME_ANDROID =
	'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';

/**
 * Replaces the navigator signals the detection reads from.
 *
 * @param userAgent            The user agent string to report.
 * @param userAgentData        Optional User-Agent Client Hints data.
 * @param userAgentData.brands The brand list a Chromium browser would report.
 */
function mockNavigator(
	userAgent: string,
	userAgentData?: { brands?: { brand: string; version: string }[] }
) {
	Object.defineProperty( window.navigator, 'userAgent', {
		value: userAgent,
		configurable: true,
	} );
	Object.defineProperty( window.navigator, 'userAgentData', {
		value: userAgentData,
		configurable: true,
	} );
}

describe( 'getHeicUnsupportedMessage', () => {
	afterEach( () => {
		mockNavigator( '', undefined );
	} );

	it( 'names Firefox and suggests the browsers that work on macOS', () => {
		mockNavigator( FIREFOX_MAC );

		expect( getHeicUnsupportedMessage() ).toBe(
			"Firefox can't read HEIC photos, so we couldn't convert this one. Safari or Chrome usually can, or you can upload a JPEG instead."
		);
	} );

	it( 'names Firefox and suggests the browsers that work on Windows', () => {
		mockNavigator( FIREFOX_WINDOWS );

		const message = getHeicUnsupportedMessage();

		expect( message ).toBe(
			"Firefox can't read HEIC photos, so we couldn't convert this one. Chrome or Edge might, or you can upload a JPEG instead."
		);
		// Safari has not shipped on Windows in over a decade.
		expect( message ).not.toContain( 'Safari' );
	} );

	it( 'blames the platform rather than the browser on Linux', () => {
		mockNavigator( FIREFOX_LINUX );

		const message = getHeicUnsupportedMessage();

		expect( message ).toBe(
			"HEIC photos can't be decoded on Linux, so unfortunately we couldn't convert this one. You can upload a JPEG instead."
		);
		// No Linux browser decodes HEIC, so none should be suggested.
		expect( message ).not.toContain( 'Firefox' );
		expect( message ).not.toContain( 'Chrome' );
	} );

	it( 'identifies Safari, which reports itself without a Chrome token', () => {
		mockNavigator( SAFARI_MAC );

		expect( getHeicUnsupportedMessage() ).toBe(
			"Safari couldn't decode HEIC on this Mac, so we couldn't convert this one. You can upload a JPEG instead."
		);
	} );

	it( 'suggests only Safari to a failing Chromium browser on macOS', () => {
		mockNavigator( CHROME_MAC );

		expect( getHeicUnsupportedMessage() ).toBe(
			"Chrome couldn't decode HEIC on this Mac, so we couldn't convert this one. Safari usually can, or you can upload a JPEG instead."
		);
	} );

	it( 'sends a failing Chromium browser on Windows straight to JPEG', () => {
		mockNavigator( CHROME_WINDOWS );

		const message = getHeicUnsupportedMessage();

		expect( message ).toBe(
			"Chrome couldn't decode HEIC on this PC, so we couldn't convert this one. You can upload a JPEG instead."
		);
		// Suggesting the browser that just failed would be nonsense.
		expect( message ).not.toContain( 'Chrome or Edge might' );
	} );

	it( 'names Edge rather than treating it as Chrome or Safari', () => {
		mockNavigator( EDGE_WINDOWS );

		expect( getHeicUnsupportedMessage() ).toBe(
			"Edge couldn't decode HEIC on this PC, so we couldn't convert this one. You can upload a JPEG instead."
		);
	} );

	it( 'prefers User-Agent Client Hints when they are available', () => {
		// Chromium browsers freeze the Safari/Chrome tokens in the UA string,
		// so the brand list is the more reliable signal.
		mockNavigator( SAFARI_MAC, {
			brands: [
				{ brand: 'Chromium', version: '126' },
				{ brand: 'Google Chrome', version: '126' },
			],
		} );

		expect( getHeicUnsupportedMessage() ).toContain(
			"Chrome couldn't decode HEIC on this Mac"
		);
	} );

	it( 'does not recommend macOS browsers on iOS, which reports "like Mac OS X"', () => {
		mockNavigator(
			'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
		);

		const message = getHeicUnsupportedMessage();

		expect( message ).toBe(
			"Safari couldn't decode HEIC on this device, so we couldn't convert this one. You can upload a JPEG instead."
		);
	} );

	it( 'does not blame Linux on Android, which reports itself as Linux', () => {
		mockNavigator( CHROME_ANDROID );

		const message = getHeicUnsupportedMessage();

		expect( message ).toBe(
			"Chrome couldn't decode HEIC on this device, so we couldn't convert this one. You can upload a JPEG instead."
		);
		expect( message ).not.toContain( 'Linux' );
	} );

	it( 'uses a generic phrase when the browser cannot be identified', () => {
		mockNavigator( 'Some unknown agent' );

		expect( getHeicUnsupportedMessage() ).toBe(
			"This browser can't read HEIC photos, so we couldn't convert this one. You can upload a JPEG instead."
		);
	} );
} );

describe( 'getHeicConversionAdvice', () => {
	afterEach( () => {
		mockNavigator( '', undefined );
	} );

	it( 'uses the platform reported by User-Agent Client Hints', () => {
		Object.defineProperty( window.navigator, 'userAgentData', {
			value: { platform: 'macOS' },
			configurable: true,
		} );

		expect( getHeicConversionAdvice() ).toBe(
			'Safari or Chrome usually can, or you can upload a JPEG instead.'
		);
	} );

	it( 'always ends with the JPEG fallback', () => {
		for ( const userAgent of [
			FIREFOX_MAC,
			FIREFOX_WINDOWS,
			FIREFOX_LINUX,
			CHROME_MAC,
			CHROME_WINDOWS,
			SAFARI_MAC,
		] ) {
			mockNavigator( userAgent );
			expect( getHeicConversionAdvice() ).toContain(
				'upload a JPEG instead'
			);
		}
	} );
} );
