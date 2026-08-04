/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Browser families that matter for HEIC decoding.
 *
 * `chromium` covers Chrome, Edge, Brave and Opera, which all share the same
 * platform codec plumbing.
 */
type BrowserFamily = 'firefox' | 'safari' | 'chromium' | null;

/**
 * Operating systems that matter for HEIC decoding.
 */
type Platform = 'macos' | 'windows' | 'other';

interface UserAgentBrand {
	brand: string;
	version: string;
}

interface NavigatorUserAgentData {
	brands?: UserAgentBrand[];
	platform?: string;
}

interface NavigatorExtended extends Navigator {
	userAgentData?: NavigatorUserAgentData;
}

/**
 * Detects the browser family of the current environment.
 *
 * Prefers the User-Agent Client Hints API and falls back to the user agent
 * string, which is still the only signal Firefox and Safari expose.
 *
 * @return The browser family, or `null` when it cannot be determined.
 */
function detectBrowserFamily(): BrowserFamily {
	if ( typeof navigator === 'undefined' ) {
		return null;
	}

	const brands = ( navigator as NavigatorExtended ).userAgentData?.brands;
	if ( brands?.length ) {
		// Every Chromium browser lists a "Chromium" brand alongside its own.
		if ( brands.some( ( { brand } ) => /Chromium/i.test( brand ) ) ) {
			return 'chromium';
		}
	}

	const userAgent = navigator.userAgent || '';

	// Firefox on iOS reports as FxiOS and uses the system WebKit engine, but it
	// exposes neither HEIC decoding path, so it is grouped with Firefox.
	if ( /Firefox|FxiOS/i.test( userAgent ) ) {
		return 'firefox';
	}

	// Chromium browsers all include "Chrome" (or "CriOS" on iOS) in the UA
	// string, so this has to be checked before Safari.
	if ( /Chrome|Chromium|CriOS|Edg|OPR/i.test( userAgent ) ) {
		return 'chromium';
	}

	if ( /Safari/i.test( userAgent ) ) {
		return 'safari';
	}

	return null;
}

/**
 * Detects the operating system of the current environment.
 *
 * @return The platform bucket relevant to HEIC decoding.
 */
function detectPlatform(): Platform {
	if ( typeof navigator === 'undefined' ) {
		return 'other';
	}

	const platform =
		( navigator as NavigatorExtended ).userAgentData?.platform ||
		navigator.userAgent ||
		'';

	// iOS reports "like Mac OS X" in its user agent string, so it has to be
	// ruled out before the macOS check. Every iOS browser uses the system
	// WebKit engine, which decodes HEIC, so there is no alternative to
	// recommend there.
	if ( /iPhone|iPad|iPod|iOS/i.test( platform ) ) {
		return 'other';
	}

	if ( /macOS|Mac OS X|Macintosh/i.test( platform ) ) {
		return 'macos';
	}

	if ( /Windows/i.test( platform ) ) {
		return 'windows';
	}

	return 'other';
}

/**
 * Returns the display name of the current browser family.
 *
 * @return The browser name, or `null` when it cannot be determined.
 */
function getBrowserName(): string | null {
	switch ( detectBrowserFamily() ) {
		case 'firefox':
			return 'Firefox';
		case 'safari':
			return 'Safari';
		case 'chromium':
			return 'Chrome';
		default:
			return null;
	}
}

/**
 * Returns advice on how to get a HEIC image uploaded on the current platform.
 *
 * HEIC decoding depends on codecs provided by the operating system, so which
 * browsers work varies by platform. The browser that just failed is left out of
 * the suggestions, and every variant ends with the JPEG conversion fallback,
 * which works everywhere.
 *
 * @return A localized, browser- and platform-specific sentence.
 */
export function getHeicConversionAdvice(): string {
	const platform = detectPlatform();
	const family = detectBrowserFamily();

	if ( platform === 'macos' ) {
		// Chromium browsers decode HEIC on macOS through the platform HEVC
		// video decoder, so if one of them got here the codec is unavailable
		// and only Safari is worth suggesting.
		if ( family === 'chromium' ) {
			return __(
				'Safari can convert them on macOS. You can also convert the image to JPEG before uploading.'
			);
		}

		if ( family !== 'safari' ) {
			return __(
				'Safari, Chrome, Edge, and Brave can convert them on macOS. You can also convert the image to JPEG before uploading.'
			);
		}
	}

	if ( platform === 'windows' ) {
		// On Windows the HEVC codec is a separate install, so a Chromium
		// browser failing here means the codec is missing rather than that the
		// browser is the wrong one.
		if ( family === 'chromium' ) {
			return __(
				'Installing HEVC video support from the Microsoft Store lets this browser convert them. You can also convert the image to JPEG before uploading.'
			);
		}

		return __(
			'Chrome, Edge, and Brave can convert them on Windows when HEVC video support is installed. You can also convert the image to JPEG before uploading.'
		);
	}

	return __(
		'Converting the image to JPEG before uploading it will work on any browser.'
	);
}

/**
 * Builds the message shown when a HEIC image cannot be converted.
 *
 * Names the browser that failed, then lists the browsers that do work on the
 * current operating system.
 *
 * @return A localized, browser- and platform-specific error message.
 */
export function getHeicUnsupportedMessage(): string {
	const browserName = getBrowserName();

	const cause = browserName
		? sprintf(
				/* translators: %s: browser name, e.g. "Firefox". */
				__( '%s cannot convert HEIC images on this device.' ),
				browserName
		  )
		: __( 'This browser cannot convert HEIC images on this device.' );

	return `${ cause } ${ getHeicConversionAdvice() }`;
}
