/**
 * External dependencies
 */
const semver = require( 'semver' );

/**
 * Follow the WordPress version guidelines to compute
 * the version to be used By default, increase the "minor"
 * number but if we reach 9, bump to the next major.
 *
 * @param {string} version Current version.
 * @return {string} Next Major Version.
 */
function getNextMajorVersion( version ) {
	const parsedVersion = semver.parse( version );
	if ( parsedVersion.minor === 9 ) {
		return parsedVersion.major + 1 + '.0.0';
	}
	return parsedVersion.major + '.' + ( parsedVersion.minor + 1 ) + '.0';
}

module.exports = {
	getNextMajorVersion,
};
