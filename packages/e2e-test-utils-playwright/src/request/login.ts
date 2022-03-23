/**
 * Internal dependencies
 */
import type { RequestUtils } from './index';

export interface User {
	username: string;
	password: string;
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

export { login };
