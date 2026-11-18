import { __ } from '@wordpress/i18n';
import { isURL, prependHTTPS } from '@wordpress/url';
import isURLLike, { isHashLink, isRelativePath } from './is-url-like';
import type { LinkControlValidity } from './types';

/**
 * Validates a URL entered in a link field, such as `LinkControl` or the image
 * link popover, so that every link field accepts the same values.
 *
 * @param urlToValidate The URL string to validate.
 * @return The validity of the URL, with an error message when it is invalid.
 */
export default function validateUrl(
	urlToValidate: string | null | undefined
): LinkControlValidity {
	const invalidResult: LinkControlValidity = {
		type: 'invalid',
		message: __( 'Please enter a valid URL.' ),
	};

	const validResult: LinkControlValidity = {
		type: 'valid',
	};

	const trimmedValue = urlToValidate?.trim();

	// If empty or not URL-like, return invalid
	if ( ! trimmedValue?.length || ! isURLLike( trimmedValue ) ) {
		return invalidResult;
	}

	// Hash links (internal anchor links) and relative paths (/, ./, ../) are
	// valid href values but cannot be validated by the native URL constructor
	// (which requires absolute URLs). These are already validated by isURLLike.
	// Skip URL constructor validation for these cases.
	if ( isHashLink( trimmedValue ) || isRelativePath( trimmedValue ) ) {
		return validResult;
	}

	// Perform URL validation using the native URL constructor as the authoritative source.
	// The native URL constructor is the standard for URL validity - if it accepts a URL,
	// we should allow it. For URLs without a protocol (e.g., "www.wordpress.org"),
	// prepend "https://" before validating, as the URL constructor requires a protocol.
	//
	// Note: Protocol URLs (mailto:, tel:, etc.) are also validated by the native
	// URL constructor, so we don't need special handling for them.
	//
	// Note: We rely on the native URL constructor rather than implementing custom TLD
	// validation to avoid blocking valid URLs. If a URL passes the native constructor,
	// it's technically valid according to web standards.
	const urlToCheck = prependHTTPS( trimmedValue );
	return isURL( urlToCheck ) ? validResult : invalidResult;
}
