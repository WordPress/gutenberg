/**
 * Given a SemVer-formatted version string, returns an assumed milestone title
 * associated with that version.
 *
 * @see https://semver.org/
 *
 * @param {string} version Version string.
 *
 * @return {string} Milestone title.
 */
function getMilestone( version ) {
	const [ major, minor ] = version.split( '.' );
	return `Gutenberg ${ major }.${ minor }`;
}

module.exports = getMilestone;
