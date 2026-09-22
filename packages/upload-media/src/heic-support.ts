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
type Platform = 'macos' | 'windows' | 'linux' | 'other';

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

	// Android and ChromeOS both report as Linux, and both decode HEIC through
	// their own platform codecs, so they have to be ruled out before the Linux
	// check.
	if ( /Android|CrOS|Chrome OS/i.test( platform ) ) {
		return 'other';
	}

	if ( /Linux|X11/i.test( platform ) ) {
		return 'linux';
	}

	return 'other';
}

/**
 * Returns the display name of the current browser.
 *
 * @return The browser name, or `null` when it cannot be determined.
 */
function getBrowserName(): string | null {
	if ( detectBrowserFamily() === 'chromium' ) {
		// Edge and Opera are worth naming individually: they are common enough
		// that being told "Chrome" failed would just be confusing.
		const brands =
			( navigator as NavigatorExtended ).userAgentData?.brands ?? [];
		const userAgent = navigator.userAgent || '';

		if (
			brands.some( ( { brand } ) => /Edge/i.test( brand ) ) ||
			/Edg\//i.test( userAgent )
		) {
			return 'Edge';
		}

		if (
			brands.some( ( { brand } ) => /Opera/i.test( brand ) ) ||
			/OPR\//i.test( userAgent )
		) {
			return 'Opera';
		}

		return 'Chrome';
	}

	switch ( detectBrowserFamily() ) {
		case 'firefox':
			return 'Firefox';
		case 'safari':
			return 'Safari';
		default:
			return null;
	}
}

/**
 * Returns advice on how to get a HEIC image uploaded on the current platform.
 *
 * HEIC decoding depends on codecs provided by the operating system, so which
 * browsers work varies by platform. The browser that just failed is left out of
 * the suggestions, and every variant ends with the JPEG fallback, which works
 * everywhere.
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
				'Safari usually can, or you can upload a JPEG instead.'
			);
		}

		if ( family !== 'safari' ) {
			return __(
				'Safari or Chrome usually can, or you can upload a JPEG instead.'
			);
		}
	}

	// On Windows the HEVC codec is a separate install, so a Chromium browser
	// failing here means the codec is missing rather than that the browser is
	// the wrong one. Only Firefox gets pointed at another browser.
	if ( platform === 'windows' && family === 'firefox' ) {
		return __( 'Chrome or Edge might, or you can upload a JPEG instead.' );
	}

	return __( 'You can upload a JPEG instead.' );
}

/**
 * Builds the message shown when a HEIC image cannot be converted.
 *
 * Explains why the conversion failed in terms of the current browser and
 * operating system, then hands off to the advice for that combination.
 *
 * @return A localized, browser- and platform-specific error message.
 */
export function getHeicUnsupportedMessage(): string {
	const platform = detectPlatform();
	const family = detectBrowserFamily();
	const browserName = getBrowserName();

	/*
	 * Each platform gets its own complete sentence rather than a shared one with
	 * the device name interpolated in, so that translators always see the whole
	 * thing.
	 */
	let cause;

	if ( platform === 'linux' ) {
		// No Linux browser ships an HEVC decoder, so naming one would only
		// send people on a fruitless hunt for a different browser.
		cause = __(
			"HEIC photos can't be decoded on Linux, so unfortunately we couldn't convert this one."
		);
	} else if ( family === 'firefox' ) {
		cause = __(
			"Firefox can't read HEIC photos, so we couldn't convert this one."
		);
	} else if ( browserName && platform === 'windows' ) {
		cause = sprintf(
			/* translators: %s: browser name, e.g. "Chrome". */
			__(
				"%s couldn't decode HEIC on this PC, so we couldn't convert this one."
			),
			browserName
		);
	} else if ( browserName && platform === 'macos' ) {
		cause = sprintf(
			/* translators: %s: browser name, e.g. "Safari". */
			__(
				"%s couldn't decode HEIC on this Mac, so we couldn't convert this one."
			),
			browserName
		);
	} else if ( browserName ) {
		cause = sprintf(
			/* translators: %s: browser name, e.g. "Chrome". */
			__(
				"%s couldn't decode HEIC on this device, so we couldn't convert this one."
			),
			browserName
		);
	} else {
		cause = __(
			"This browser can't read HEIC photos, so we couldn't convert this one."
		);
	}

	return `${ cause } ${ getHeicConversionAdvice() }`;
}
