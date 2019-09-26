/**
 * External dependencies
 */
const chalk = require( 'chalk' );

/**
 * Node dependencies.
 */
const { env, exit, stdout } = require( 'process' );
const { normalize } = require( 'path' );
const { existsSync } = require( 'fs' );
const { userInfo } = require( 'os' );

/**
 * Internal dependencies
 */
const {
	getArgsFromCLI,
	getManagedWordPressPath,
	spawnScript,
} = require( '../utils' );

const args = getArgsFromCLI();

if ( ! args.length ) {
	const scripts = {
		install: "If you don't have a check out of the WordPress repository that you want to work with, this will automatically download, configure, and connect to WordPress.",
		connect: chalk`If you have a WordPress respository already, define the {magenta WP_DEVELOP_DIR} environment variable with the path to your repository, then run this command to add this plugin to it.`,
		start: "This will start a container that you've already installed and connected to.",
		stop: "And this will stop it when you're done!",
		update: chalk`If you used {blue npm run env install} to setup WordPress, run this command to update it.`,
		reinstall: 'Resets the database and re-configures WordPress again.',
		cli: 'Run WP-CLI commands against the WordPress install.',
		'lint-php': 'Run PHPCS linting on the plugin.',
		'test-php': "Run the plugin's PHPUnit tests.",
		'docker-run': chalk`For more advanced debugging, you may sometimes need to run commands in the Docker containers. This is the equivalent of running {blue docker-compose run}.`,
	};

	stdout.write( chalk`{white Welcome to the WordPress Local Environment! There are several commands available to help you get up and running. Each of these commands should be run after {blue npm run env}. For example, {blue npm run env install}.}\n\n` );

	Object.keys( scripts ).forEach( ( script ) => {
		stdout.write( chalk.green( script ) + '\n    ' + chalk.white( scripts[ script ] ) + '\n\n' );
	} );
	exit( 0 );
}

const user = userInfo();

if ( ! env.PHP_FPM_UID && user.uid > 0 ) {
	env.PHP_FPM_UID = user.uid;
}

if ( ! env.PHP_FPM_GID && user.gid > 0 ) {
	env.PHP_FPM_GID = user.gid;
}

const command = args.shift();

if ( ! env.WP_DEVELOP_DIR && command !== 'install' ) {
	if ( existsSync( normalize( getManagedWordPressPath() + '/wp-config.php' ) ) ) {
		env.WP_DEVELOP_DIR = getManagedWordPressPath();
		env.MANAGED_WP = true;
	} else {
		stdout.write( chalk`{white Please ensure the {magenta WP_DEVELOP_DIR} environment variable is set to your WordPress Development directory before running this script.}\n\n` );
		stdout.write( chalk`{white If you don't have a WordPress Development directory to use, run {blue npm run env install} to automatically configure one!}\n` );
		exit( 1 );
	}
}

spawnScript( `env/${ command }`, args );
