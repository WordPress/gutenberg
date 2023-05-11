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
	// we're just going to say that the host user is root. On Windows you'll likely be
	// using WSL to run commands inside the container, which has a uid and gid. If
	// you aren't, you'll be mounting directories from Windows, to a Linux
	// VM (Docker Desktop uses one), to the guest OS. I assume that
	// when dealing with this configuration that file ownership
	// has the same kind of magic handling that macOS uses.
	const uid = ( hostUser.uid === -1 ? 0 : hostUser.uid ).toString();
	const gid = ( hostUser.gid === -1 ? 0 : hostUser.gid ).toString();

	return {
		name: hostUser.username,
		uid,
		gid,
		fullUser: uid + ':' + gid,
	};
};
