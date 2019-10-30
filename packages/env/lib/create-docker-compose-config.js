module.exports = function createDockerComposeConfig(
	cwd,
	cwdName,
	cwdTestsPath,
	context
) {
	const commonVolumes = `
      - ${ cwd }/:/var/www/html/wp-content/${ context.type }s/${ cwdName }/
      - ${ cwd }${ cwdTestsPath }/e2e-tests/mu-plugins/:/var/www/html/wp-content/mu-plugins/
      - ${ cwd }${ cwdTestsPath }/e2e-tests/plugins/:/var/www/html/wp-content/plugins/${ cwdName }-test-plugins/`;
	const volumes = `
      - ${ cwd }/../${ cwdName }-wordpress/:/var/www/html/${ commonVolumes }`;
	const testsVolumes = `
      - tests-wordpress:/var/www/html/${ commonVolumes }`;
	return `version: '2.1'
volumes:
  tests-wordpress:
services:
  mysql:
    environment:
      MYSQL_ROOT_PASSWORD: password
    image: mariadb
  wordpress:
    depends_on:
      - mysql
    environment:
      WORDPRESS_DEBUG: 1cq
      WORDPRESS_DB_NAME: wordpress
      WORDPRESS_DB_PASSWORD: password
    image: wordpress
    ports:
      - \${WP_ENV_PORT:-8888}:80
    volumes:${ volumes }
  wordpress-cli:
    depends_on:
      - wordpress
    image: wordpress:cli
    volumes:${ volumes }
  tests-wordpress:
    depends_on:
      - mysql
    environment:
      WORDPRESS_DEBUG: 1cq
      WORDPRESS_DB_NAME: tests-wordpress
      WORDPRESS_DB_PASSWORD: password
    image: wordpress
    ports:
      - \${WP_ENV_TESTS_PORT:-8889}:80
    volumes:${ testsVolumes }
  tests-wordpress-cli:
    depends_on:
      - tests-wordpress
    image: wordpress:cli
    volumes:${ testsVolumes }
  `;
};
