/**
 * Internal dependencies
 */
import type { RequestUtils } from './index';

/**
 * Create user using REST API.
 *
 * @param {} this RequestUtils.
 * @param {string} username User Name.
 * @param {string} firstName First Name.
 * @param {string} lastName Last Name.
 */
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

/**
 * Delete user using REST API.
 *
 * @param {} this RequestUtils.
 * @param {string} username User Name.
 */
async function deleteUser( this: RequestUtils, username: string ) {
	// List user.
	// https://developer.wordpress.org/rest-api/reference/users/#list-users
	const user = await this.rest( {
		method: 'GET',
		path: '/wp/v2/users',
		params: {
			search: username,
		},
	} );
	// Delete User
	// https://developer.wordpress.org/rest-api/reference/users/#delete-a-user
	await this.rest( {
		method: 'DELETE',
		path: `/wp/v2/users/${ user[ 0 ].id }`,
		params: {
			force: true,
			reassign: 0,
		},
	} );
}

export { createUser, deleteUser };
