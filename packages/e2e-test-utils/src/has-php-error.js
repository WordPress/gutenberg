/**
 * Regular expression matching a displayed PHP error within a markup string.
 *
 * @see https://github.com/php/php-src/blob/598175e/main/main.c#L1257-L1297
 *
 * @type {RegExp}
 */
const REGEXP_PHP_ERROR = /<b>(Fatal error|Recoverable fatal error|Warning|Parse error|Notice|Strict Standards|Deprecated|Unknown error)<\/b>:  /;

/**
 * Returns a promise resolving to a boolean reflecting whether a PHP notice is
 * present anywhere within the document's markup. This requires the environment
 * be configured to display errors.
 *
 * @see http://php.net/manual/en/function.error-reporting.php
 *
 * @return {Promise} Promise resolving to a boolean reflecting whether a PHP
 *                   notice is present.
 */
export async function hasPHPError() {
	return REGEXP_PHP_ERROR.test( await page.content() );
}
