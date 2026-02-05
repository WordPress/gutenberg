'use strict';
/**
 * Internal dependencies
 */
const { findAvailablePort } = require( './port-utils' );
const addOrReplacePort = require( './config/add-or-replace-port' );

/**
 * @typedef {import('./config').WPConfig} WPConfig
 */

/**
 * Resolves available ports for the given configuration.
 * If configured ports are busy, finds alternatives within the specified range.
 *
 * @param {WPConfig} config  The wp-env configuration object.
 * @param {Object}   spinner A CLI spinner for displaying progress.
 * @return {Promise<{config: WPConfig, portMessages: string[]}>} The updated config and messages about port changes.
 */
async function resolveAvailablePorts( config, spinner ) {
	const portMessages = [];
	const usedPorts = [];

	// Resolve development environment port
	const devPortResult = await resolvePort( {
		preferredPort: config.env.development.port,
		exclude: usedPorts,
		portName: 'development',
		spinner,
	} );
	config.env.development.port = devPortResult.port;
	usedPorts.push( devPortResult.port );
	if ( devPortResult.message ) {
		portMessages.push( devPortResult.message );
	}

	// Update WP_HOME and WP_SITEURL for development if port changed
	if ( devPortResult.changed ) {
		config.env.development.config.WP_SITEURL = addOrReplacePort(
			config.env.development.config.WP_SITEURL,
			devPortResult.port
		);
		config.env.development.config.WP_HOME = addOrReplacePort(
			config.env.development.config.WP_HOME,
			devPortResult.port
		);
	}

	// Resolve tests environment port
	const testsPortResult = await resolvePort( {
		preferredPort: config.env.tests.port,
		exclude: usedPorts,
		portName: 'tests',
		spinner,
	} );
	config.env.tests.port = testsPortResult.port;
	usedPorts.push( testsPortResult.port );
	if ( testsPortResult.message ) {
		portMessages.push( testsPortResult.message );
	}

	// Update WP_HOME, WP_SITEURL, and WP_TESTS_DOMAIN for tests if port changed
	if ( testsPortResult.changed ) {
		config.env.tests.config.WP_SITEURL = addOrReplacePort(
			config.env.tests.config.WP_SITEURL,
			testsPortResult.port
		);
		config.env.tests.config.WP_HOME = addOrReplacePort(
			config.env.tests.config.WP_HOME,
			testsPortResult.port
		);
		config.env.tests.config.WP_TESTS_DOMAIN = addOrReplacePort(
			config.env.tests.config.WP_TESTS_DOMAIN,
			testsPortResult.port
		);
	}

	// Resolve MySQL port for development (if configured)
	if ( config.env.development.mysqlPort ) {
		const devMysqlResult = await resolvePort( {
			preferredPort: config.env.development.mysqlPort,
			exclude: usedPorts,
			portName: 'development MySQL',
			spinner,
		} );
		config.env.development.mysqlPort = devMysqlResult.port;
		usedPorts.push( devMysqlResult.port );
		if ( devMysqlResult.message ) {
			portMessages.push( devMysqlResult.message );
		}
	}

	// Resolve MySQL port for tests (if configured)
	if ( config.env.tests.mysqlPort ) {
		const testsMysqlResult = await resolvePort( {
			preferredPort: config.env.tests.mysqlPort,
			exclude: usedPorts,
			portName: 'tests MySQL',
			spinner,
		} );
		config.env.tests.mysqlPort = testsMysqlResult.port;
		usedPorts.push( testsMysqlResult.port );
		if ( testsMysqlResult.message ) {
			portMessages.push( testsMysqlResult.message );
		}
	}

	// Resolve phpMyAdmin port for development (if configured)
	if ( config.env.development.phpmyadminPort ) {
		const devPhpmyadminResult = await resolvePort( {
			preferredPort: config.env.development.phpmyadminPort,
			exclude: usedPorts,
			portName: 'development phpMyAdmin',
			spinner,
		} );
		config.env.development.phpmyadminPort = devPhpmyadminResult.port;
		usedPorts.push( devPhpmyadminResult.port );
		if ( devPhpmyadminResult.message ) {
			portMessages.push( devPhpmyadminResult.message );
		}
	}

	// Resolve phpMyAdmin port for tests (if configured)
	if ( config.env.tests.phpmyadminPort ) {
		const testsPhpmyadminResult = await resolvePort( {
			preferredPort: config.env.tests.phpmyadminPort,
			exclude: usedPorts,
			portName: 'tests phpMyAdmin',
			spinner,
		} );
		config.env.tests.phpmyadminPort = testsPhpmyadminResult.port;
		usedPorts.push( testsPhpmyadminResult.port );
		if ( testsPhpmyadminResult.message ) {
			portMessages.push( testsPhpmyadminResult.message );
		}
	}

	return { config, portMessages };
}

/**
 * Resolves a single port, finding an alternative if the preferred port is busy.
 *
 * @param {Object}   options               Options for port resolution.
 * @param {number}   options.preferredPort The preferred port to use.
 * @param {number[]} options.exclude       Ports to exclude.
 * @param {string}   options.portName      Name of the port for messages.
 * @param {Object}   options.spinner       CLI spinner.
 * @return {Promise<{port: number, changed: boolean, message: ?string}>} Resolution result.
 */
async function resolvePort( { preferredPort, exclude, portName, spinner } ) {
	if ( spinner ) {
		spinner.text = `Checking ${ portName } port availability.`;
	}

	try {
		const resolvedPort = await findAvailablePort( {
			preferredPort,
			exclude,
		} );

		const changed = resolvedPort !== preferredPort;
		let message = null;

		if ( changed ) {
			message = `Port ${ preferredPort } was busy, using ${ resolvedPort } for ${ portName } instead.`;
		}

		return { port: resolvedPort, changed, message };
	} catch ( error ) {
		// Re-throw with more context
		throw new Error(
			`Could not find available port for ${ portName }: ${ error.message }`
		);
	}
}

module.exports = resolveAvailablePorts;
