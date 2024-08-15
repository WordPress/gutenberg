/**
 * Internal dependencies
 */
import type { RequestUtils } from './index';

export interface User {
	id: number;
	name: string;
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

export interface UserRequestData {
	username: string;
	email: string;
	first_name?: string;
	last_name?: string;
	password?: string;
	roles?: string[];
}

/**
 * List all users.
 *
 * @see https://developer.wordpress.org/rest-api/reference/users/#list-users
 * @param this
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
 * @param this
 * @param user User data to create.
 */
async function createUser( this: RequestUtils, user: UserData ) {
	const userData: UserRequestData = {
		username: user.username,
		email: user.email,
	};

	if ( user.firstName ) {
		userData.first_name = user.firstName;
	}

	if ( user.lastName ) {
		userData.last_name = user.lastName;
	}

	if ( user.password ) {
		userData.password = user.password;
	}

	if ( user.roles ) {
		userData.roles = user.roles;
	}

	const response = await this.rest< User >( {
		method: 'POST',
		path: '/wp/v2/users',
		data: userData,
	} );

	return response;
}

/**
 * Delete a user.
 *
 * @see https://developer.wordpress.org/rest-api/reference/users/#delete-a-user
 * @param this
 * @param userId The ID of the user.
 */
async function deleteUser( this: RequestUtils, userId: number ) {
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
 * @param this
 */
async function deleteAllUsers( this: RequestUtils ) {
	const users = await listUsers.bind( this )();

	// The users endpoint doesn't support batch request yet.
	const responses = await Promise.all(
		users
			// Do not delete neither root user nor the current user.
			.filter(
				( user: User ) =>
					user.id !== 1 && user.name !== this.user.username
			)
			.map( ( user: User ) => deleteUser.bind( this )( user.id ) )
	);

	return responses;
}

export { createUser, deleteAllUsers };
