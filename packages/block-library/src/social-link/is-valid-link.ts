import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { isEmail, isURL, prependHTTPS } from '@wordpress/url';
import { unlock } from '../lock-unlock';

const { isURLLike } = unlock( blockEditorPrivateApis );

/**
 * Returns whether a Social Icon's link looks valid: a URL, with or without
 * its protocol, or an email address for the Mail icon. It uses the same check
 * as the link popover, and an empty link is valid.
 *
 * @param url The link.
 * @return Whether the link is valid.
 */
export default function isValidLink( url?: string ): boolean {
	if ( ! url ) {
		return true;
	}
	return (
		isEmail( url ) ||
		( !! isURLLike( url ) && isURL( prependHTTPS( url ) ) )
	);
}
