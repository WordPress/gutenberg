module.exports = function createDockerComposeConfig(
	pluginPath,
	pluginName,
	pluginTestsPath,
	scriptsPath
) {
	const commonVolumes = `
      - ${ pluginPath }/:/var/www/html/wp-content/plugins/${ pluginName }/
      - ${ pluginPath }${ pluginTestsPath }/e2e-tests/mu-plugins/:/var/www/html/wp-content/mu-plugins/
      - ${ pluginPath }${ pluginTestsPath }/e2e-tests/plugins/:/var/www/html/wp-content/plugins/${ pluginName }-test-plugins/`;
	const volumes = `
      - ${ pluginPath }/../${ pluginName }-wordpress/:/var/www/html/${ commonVolumes }`;
	const testsVolumes = `
      - tests-wordpress:/var/www/html/${ commonVolumes }`;
	return `version: '2'
volumes:
  tests-wordpress:
  tests-wordpress-phpunit:
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
      - 8888:80
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
      - 8889:80
    volumes:${ testsVolumes }
  tests-wordpress-cli:
    depends_on:
      - tests-wordpress
    image: wordpress:cli
    volumes:${ testsVolumes }
  tests-wordpress-phpunit:
    depends_on:
      - mysql
    environment:
      PHPUNIT_DB_HOST: mysql
    image: chriszarate/wordpress-phpunit
    volumes:
      - ${ pluginPath }/:/app/
      - ${ scriptsPath }/:/scripts/
      - tests-wordpress-phpunit/:/tmp/
  composer:
    image: composer
    volumes:
      - ${ pluginPath }/:/app/
  `;
};
