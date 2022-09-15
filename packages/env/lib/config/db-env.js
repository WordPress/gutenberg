// Username and password used in all databases.
const credentials = {
	WORDPRESS_DB_USER: 'root',
	WORDPRESS_DB_PASSWORD: 'password',
};

// Environment for test database.
const tests = {
	WORDPRESS_DB_NAME: 'tests-wordpress',
	WORDPRESS_DB_HOST: 'tests-mysql',
};

// Environment for development database. DB host gets default value which is set
// elsewhere.
const development = {
	WORDPRESS_DB_NAME: 'wordpress',
};

module.exports = {
	credentials,
	tests,
	development,
};
