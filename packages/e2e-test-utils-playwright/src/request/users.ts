/**
 * Internal dependencies
 */
import type { RequestUtils } from './index';

async function getUserID( this: RequestUtils, username: string ) {
	// Get User Details
	// https://developer.wordpress.org/rest-api/reference/users/#retrieve-a-user
	const user = await this.rest( {
		method: 'GET',
		path: '/wp/v2/users',
		params: {
			search: username,
		},
	} );
	this.userID = user.ID;

	return this.userID;
}

async function createUser(
	this: RequestUtils,
	username: string,
	firstName: string,
	lastName: string
) {
	// Create User
	// https://developer.wordpress.org/rest-api/reference/users/#create-a-user
	await this.rest( {
		method: 'POST',
		path: '/wp/v2/users',
		params: {
			username,
			first_name: firstName,
			last_name: lastName,
			email: username + '@example.com',
			password: 'secret',
		},
	} );
}

async function deleteUser( this: RequestUtils, username: string ) {
	const userID = await this.getUserID( username );

	if ( ! userID ) {
		throw new Error( `The user "${ username }" doesn't exist` );
	}
	// Create User
	// https://developer.wordpress.org/rest-api/reference/users/#create-a-user
	await this.rest( {
		method: 'DELETE',
		path: `/wp/v2/users/${ userID }`,
	} );
}

export { getUserID, createUser, deleteUser };
