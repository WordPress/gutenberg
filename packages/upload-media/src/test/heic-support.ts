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

	it( 'names Firefox and lists the browsers that work on macOS', () => {
		mockNavigator( FIREFOX_MAC );

		const message = getHeicUnsupportedMessage();

		expect( message ).toContain( 'Firefox cannot convert HEIC images' );
		expect( message ).toContain(
			'Safari, Chrome, Edge, and other Chromium-based browsers'
		);
		expect( message ).toContain( 'JPEG' );
	} );

	it( 'names Firefox and mentions HEVC support on Windows', () => {
		mockNavigator( FIREFOX_WINDOWS );

		const message = getHeicUnsupportedMessage();

		expect( message ).toContain( 'Firefox cannot convert HEIC images' );
		expect( message ).toContain( 'HEVC video support' );
		expect( message ).not.toContain( 'Safari' );
	} );

	it( 'falls back to the JPEG suggestion on platforms without a working browser', () => {
		mockNavigator( FIREFOX_LINUX );

		const message = getHeicUnsupportedMessage();

		expect( message ).toContain( 'Firefox cannot convert HEIC images' );
		expect( message ).toContain( 'Converting the image to JPEG' );
		expect( message ).not.toContain( 'Safari' );
	} );

	it( 'identifies Safari, which reports itself without a Chrome token', () => {
		mockNavigator( SAFARI_MAC );

		expect( getHeicUnsupportedMessage() ).toContain(
			'Safari cannot convert HEIC images'
		);
	} );

	it( 'identifies Chromium browsers from the user agent string', () => {
		mockNavigator( CHROME_WINDOWS );

		expect( getHeicUnsupportedMessage() ).toContain(
			'Chrome cannot convert HEIC images'
		);
	} );

	it( 'points a failing Chromium browser on Windows at the HEVC codec', () => {
		mockNavigator( CHROME_WINDOWS );

		const message = getHeicUnsupportedMessage();

		expect( message ).toContain( 'requires HEVC video support' );
		// Suggesting the browser that just failed would be nonsense.
		expect( message ).not.toContain( 'Chrome, Edge, and other browsers' );
	} );

	it( 'suggests only Safari to a failing Chromium browser on macOS', () => {
		mockNavigator( CHROME_MAC );

		const message = getHeicUnsupportedMessage();

		expect( message ).toContain( 'Chrome cannot convert HEIC images' );
		expect( message ).toContain( 'Safari can convert them on macOS' );
		expect( message ).not.toContain(
			'Safari, Chrome, Edge, and other Chromium-based browsers'
		);
	} );

	it( 'identifies Edge as a Chromium browser rather than as Safari', () => {
		mockNavigator( EDGE_WINDOWS );

		expect( getHeicUnsupportedMessage() ).toContain(
			'Chrome cannot convert HEIC images'
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
			'Chrome cannot convert HEIC images'
		);
	} );

	it( 'does not recommend macOS browsers on iOS, which reports "like Mac OS X"', () => {
		mockNavigator(
			'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
		);

		const message = getHeicUnsupportedMessage();

		expect( message ).not.toContain( 'macOS' );
		expect( message ).toContain( 'Converting the image to JPEG' );
	} );

	it( 'uses a generic phrase when the browser cannot be identified', () => {
		mockNavigator( 'Some unknown agent' );

		expect( getHeicUnsupportedMessage() ).toContain(
			'This browser cannot convert HEIC images'
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

		expect( getHeicConversionAdvice() ).toContain( 'macOS' );
	} );

	it( 'always ends with the JPEG conversion fallback', () => {
		for ( const userAgent of [
			FIREFOX_MAC,
			FIREFOX_WINDOWS,
			FIREFOX_LINUX,
		] ) {
			mockNavigator( userAgent );
			expect( getHeicConversionAdvice() ).toContain( 'JPEG' );
		}
	} );
} );
