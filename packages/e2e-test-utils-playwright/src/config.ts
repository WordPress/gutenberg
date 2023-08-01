const {
	WP_USERNAME = 'admin',
	WP_PASSWORD = 'password',
	WP_BASE_URL = 'http://localhost:8889',
} = process.env;

const WP_ADMIN_USER = {
	username: WP_ADMIN_USER.username,
	password: WP_ADMIN_USER.password,
} as const;

export { WP_ADMIN_USER, WP_USERNAME, WP_PASSWORD, WP_BASE_URL };
