/**
 * Internal dependencies
 */
import type { RequestUtils } from './index';

export interface User {
	id: number;
	email: string;
}

export interface UserData {
	username: string;
	email: string;
	firstName?: string;
	lastName?: string;
	password?: string;
	roles?: string[];
}

/**
 * List all users.
 *
 * @see https://developer.wordpress.org/rest-api/reference/users/#list-users
 * @param  this
 */
async function listUsers( this: RequestUtils ) {
	const response = await this.rest< User[] >( {
		method: 'GET',
		path: '/wp/v2/users',
		params: {
			per_page: 100,
		},
	} );

	return response;
}

/**
 * Add a test user.
 *
 * @see https://developer.wordpress.org/rest-api/reference/users/#create-a-user
 * @param  this
 * @param  user User data to create.
 */
async function createUser( this: RequestUtils, user: UserData ) {
	const response = await this.rest< User >( {
		method: 'POST',
		path: '/wp/v2/users',
		data: {
			username: user.username,
			email: user.email,
			first_name: user.firstName,
			last_name: user.lastName,
			password: user.password,
			roles: user.roles,
		},
	} );

	return response;
}

/**
 * Delete a user.
 *
 * @see https://developer.wordpress.org/rest-api/reference/users/#delete-a-user
 * @param  this
 * @param  userId The ID of the user.
 */
async function deleteUser( this: RequestUtils, userId: number ) {
	// Do not delete main user account.
	if ( userId === 1 ) {
		return new Promise( ( resolve ) => {
			resolve( true );
		} );
	}

	const response = await this.rest( {
		method: 'DELETE',
		path: `/wp/v2/users/${ userId }`,
		params: { force: true, reassign: 1 },
	} );

	return response;
}

/**
 * Delete all users except main root user.
 *
 * @param  this
 */
async function deleteAllUsers( this: RequestUtils ) {
	const users = await this.listUsers();

	// The users endpoint doesn't support batch request yet.
	const responses = await Promise.all(
		users.map( ( user ) => this.deleteUser( user.id ) )
	);

	return responses;
}

export { listUsers, createUser, deleteAllUsers, deleteUser };
