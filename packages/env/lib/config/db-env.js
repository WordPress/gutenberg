'use strict';
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

/*
 * MariaDB image used by the database services. Besides a version number, the
 * image accepts these tags, and the default follows the latest LTS release.
 */
const MARIADB_IMAGE_TAGS = [ 'lts', 'latest' ];
const DEFAULT_MARIADB_VERSION = 'lts';

/**
 * Gets the MariaDB image for an environment's configured version.
 *
 * @param {string|null|undefined} mariadbVersion The configured MariaDB version, or null for the default.
 *
 * @return {string} The image name, such as `mariadb:lts` or `mariadb:10.11`.
 */
function getMariaDBImage( mariadbVersion ) {
	return `mariadb:${ mariadbVersion ?? DEFAULT_MARIADB_VERSION }`;
}

module.exports = {
	credentials,
	tests,
	development,
	MARIADB_IMAGE_TAGS,
	DEFAULT_MARIADB_VERSION,
	getMariaDBImage,
};
