/**
 * External dependencies
 */

/**
 * Follow the WordPress version guidelines to compute
 * the version to be used By default, increment the "minor"
 * number but if we reach 9, bump to the next major.
 *
 * @param {string} version Current version.
 * @return {string} Next Major Version.
 */
function getNextMajorVersion( version ) {
	const [ major, minor ] = version.split( '.' ).map( Number );
	if ( minor === 9 ) {
		return major + 1 + '.0.0';
	}
	return major + '.' + ( minor + 1 ) + '.0';
}

/**
 * Follow the WordPress version guidelines to compute
 * the version to be used. By default, decrement the "minor"
 * number but if we reach 0, decrease to the next major.
 *
 * @param {string} version Current version.
 * @return {string} Previous Major Version.
 */
function getPreviousMajorVersion( version ) {
	const [ major, minor ] = version.split( '.' ).map( Number );
	if ( minor === 0 ) {
		return major - 1 + '.9.0';
	}
	return major + '.' + ( minor - 1 ) + '.0';
}

module.exports = {
	getNextMajorVersion,
	getPreviousMajorVersion,
};
