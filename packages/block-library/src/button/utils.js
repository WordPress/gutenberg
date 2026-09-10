import { getProtocol } from '@wordpress/url';

const ALLOWED_LINK_PROTOCOLS = [ 'http:', 'https:', 'mailto:', 'tel:', 'sms:' ];

/**
 * Returns the given link URL only if its protocol is on the safe allowlist
 * (or the URL is relative, i.e. has no protocol), otherwise null. Blocks
 * `javascript:` and other unsafe schemes from being written into the saved
 * `href`, including ones hidden behind a leading/embedded tab, newline, or
 * control character that browsers strip before resolving the scheme
 * themselves.
 *
 * @param {?string} url - The raw link URL to check.
 * @return {?string} The URL if safe, otherwise null.
 */
export function getSafeButtonUrl( url ) {
	if ( ! url || typeof url !== 'string' ) {
		return null;
	}

	const normalized = url
		.replace( /[\t\n\r]/g, '' )
		.replace( /^[\x00-\x20]+|[\x00-\x20]+$/g, '' );

	const protocol = getProtocol( normalized )?.toLowerCase();
	if ( protocol && ! ALLOWED_LINK_PROTOCOLS.includes( protocol ) ) {
		return null;
	}

	return url;
}

/**
 * Returns whether the given width value is a percentage.
 *
 * @param {string} width - The width value.
 * @return {boolean} True if the width is a percentage value.
 */
export function isPercentageWidth( width ) {
	return typeof width === 'string' && width.endsWith( '%' );
}

/**
 * Returns the width classes for the button based on the width attribute.
 *
 * @param {string} width - The width value (e.g., '25%', '50%', '75%', '100%', or custom value).
 * @return {Object} Object with width-related class names as keys and true as values.
 */
export function getWidthClasses( width ) {
	if ( ! width ) {
		return {};
	}

	if ( isPercentageWidth( width ) ) {
		const legacyWidthClasses = {
			'25%': 'wp-block-button__width-25',
			'50%': 'wp-block-button__width-50',
			'75%': 'wp-block-button__width-75',
			'100%': 'wp-block-button__width-100',
		};
		return {
			'has-custom-width': true,
			'wp-block-button__width': true,
			// Maintain legacy class for backwards compatibility.
			...( legacyWidthClasses[ width ] && {
				[ legacyWidthClasses[ width ] ]: true,
			} ),
		};
	}

	return {
		'has-custom-width': true,
	};
}
