/**
 * Internal dependencies
 */
import type { RequestUtils } from './index';

export interface User {
	username: string;
	password: string;
}

export interface RestUser extends User {
	email: string;
	first_name?: string;
	last_name?: string;
	nickname?: string;
	roles?: string;
}

async function login( this: RequestUtils, user: User = this.user ) {
	// Login to admin using request context.
	let response = await this.request.post( '/wp-login.php', {
		failOnStatusCode: true,
		form: {
			log: user.username,
			pwd: user.password,
		},
	} );
	await response.dispose();

	// Get the nonce.
	response = await this.request.get(
		'/wp-admin/admin-ajax.php?action=rest-nonce',
		{
			failOnStatusCode: true,
		}
	);
	const nonce = await response.text();

	return nonce;
}

async function createUser( this: RequestUtils, user: RestUser ) {
	return await this.rest( {
		path: 'wp/v2/users',
		method: 'POST',
		data: user,
	} );
}

async function deleteUser( this: RequestUtils, username: string ) {
	await this.rest( {
		path: `wp/v2/users/${ username }`,
		method: 'DELETE',
		params: {
			force: true,
		},
	} );
}

export { login, createUser, deleteUser };
