/**
 * External dependencies
 */
const os = require( 'os' );

/**
 * Gets information about the host user.
 *
 * @return {Object} The host user's name, uid, and gid.
 */
module.exports = function getHostUser() {
	const hostUser = os.userInfo();
	const uid = ( hostUser.uid === -1 ? 0 : hostUser.uid ).toString();
	const gid = ( hostUser.gid === -1 ? 0 : hostUser.gid ).toString();

	return {
		name: hostUser.username,
		uid,
		gid,
		fullUser: uid + ':' + gid,
	};
};
