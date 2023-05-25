'use strict';
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

	// On Windows the uid and gid will be -1. Since there isn't a great way to handle this,
	// we're just going to assign them to 1000. Docker Desktop already takes care of
	// permission-related issues using magic, so this should be fine.
	const uid = ( hostUser.uid === -1 ? 1000 : hostUser.uid ).toString();
	const gid = ( hostUser.gid === -1 ? 1000 : hostUser.gid ).toString();

	return {
		name: hostUser.username,
		uid,
		gid,
		fullUser: uid + ':' + gid,
	};
};
