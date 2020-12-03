export function detectBrowser( browser ) {
	return window?.navigator?.userAgent.toLowerCase().indexOf( browser ) > -1;
}

/**
 * Check if the browser is Chrome.
 *
 * @return {boolean} True, if Chrome.
 */
export function isChrome() {
	return detectBrowser( 'chrome' );
}

/**
 * Check if the browser is Firefox.
 *
 * @return {boolean} True, if Firefox.
 */
export function isFirefox() {
	return detectBrowser( 'firefox' );
}

/**
 * Check if the browser is Safari.
 *
 * @return {boolean} True, if Safari.
 */
export function isSafari() {
	return detectBrowser( 'safari' );
}
