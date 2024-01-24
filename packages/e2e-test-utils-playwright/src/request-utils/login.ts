/**
 * Internal dependencies
 */
import type { RequestUtils } from './index';

export interface User {
	username: string;
	password: string;
}

async function login( this: RequestUtils, user: User = this.user ) {
	// Get the client ID and secret from the environment.
	const clientId = process.env.WP_CLIENT_ID;
	const clientSecret = process.env.WP_CLIENT_SECRET;
	if ( ! clientId || ! clientSecret ) {
		throw new Error(
			'WP_CLIENT_ID and WP_CLIENT_SECRET environment variables must be set.'
		);
	}

	// Log in and get the bearer token.
	const response = await this.request.post(
		'https://wordpress.com/wp-login.php?action=login-endpoint',
		{
			failOnStatusCode: true,
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			form: {
				username: user.username,
				password: user.password,
				client_id: clientId,
				client_secret: clientSecret,
			},
		}
	);

	const payload = await response.json();

	await response.dispose();

	if ( ! payload.success ) {
		throw new Error(
			'Unable to log in. Please check your username and password.'
		);
	}
}

export { login };
