const WP_ADMIN_USER = {
	username: 'admin',
	password: 'password',
};

const {
	WP_USERNAME = WP_ADMIN_USER.username,
	WP_PASSWORD = WP_ADMIN_USER.password,
} = process.env;

export {
	WP_ADMIN_USER,
	WP_USERNAME,
	WP_PASSWORD,
};
