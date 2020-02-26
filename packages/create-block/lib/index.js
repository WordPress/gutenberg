/**
 * External dependencies
 */
const execa = require( 'execa' );
const program = require( 'commander' );
const inquirer = require( 'inquirer' );
const { startCase } = require( 'lodash' );

/**
 * Internal dependencies
 */
const CLIError = require( './cli-error' );
const log = require( './log' );
const { engines, version } = require( '../package.json' );
const scaffold = require( './scaffold' );
const { getDefaultValues, getPrompts } = require( './templates' );

async function checkSystemRequirements() {
	try {
		await execa( 'check-node-version', [
			'--node',
			engines.node,
			'--npm',
			engines.npm,
		] );
	} catch ( error ) {
		log.error( 'Minimum system requirements not met!' );
		log.error( error.stderr );
		log.info( error.stdout );
		process.exit( error.exitCode );
	}
}

const commandName = `wp-create-block`;
program
	.name( commandName )
	.description(
		'Generates PHP, JS and CSS code for registering a block for a WordPress plugin.\n\n' +
			'[slug] is optional. When provided it triggers the quick mode where it is used ' +
			'as the block slug used for its identification, the output location for scaffolded files, ' +
			'and the name of the WordPress plugin. The rest of the configuration is set to all default values.'
	)
	.version( version )
	.arguments( '[slug]' )
	.option(
		'-t, --template <name>',
		'template type name, allowed values: "es5", "esnext"',
		'esnext'
	)
	.action( async ( slug, { template } ) => {
		await checkSystemRequirements();
		try {
			const defaultValues = getDefaultValues( template );
			if ( slug ) {
				const answers = {
					...defaultValues,
					slug,
					// Transforms slug to title.
					title: startCase( slug ),
				};
				await scaffold( template, answers );
			} else {
				const answers = await inquirer.prompt( getPrompts( template ) );
				await scaffold( template, {
					...defaultValues,
					...answers,
				} );
			}
		} catch ( error ) {
			if ( error instanceof CLIError ) {
				log.error( error.message );
				process.exit( 1 );
			} else {
				throw error;
			}
		}
	} )
	.on( '--help', function() {
		log.info( '' );
		log.info( 'Examples:' );
		log.info( `  $ ${ commandName }` );
		log.info( `  $ ${ commandName } todo-list` );
		log.info( `  $ ${ commandName } --template es5 todo-list` );
	} )
	.parse( process.argv );
