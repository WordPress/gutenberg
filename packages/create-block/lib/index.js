/**
 * External dependencies
 */
const program = require( 'commander' );
const inquirer = require( 'inquirer' );

/**
 * Internal dependencies
 */
const CLIError = require( './cli-error' );
const {
	error,
	info,
} = require( './log' );
const { version } = require( '../package.json' );
const scaffold = require( './scaffold' );
const {
	getDefaultAnswers,
	getPrompts,
} = require( './templates' );
const { startCase } = require( './utils' );

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
	.option( '-t, --template <name>', 'template type name, allowed values: "es5", "esnext"', 'esnext' )
	.action( async ( slug, { template } ) => {
		try {
			const defaultAnswers = getDefaultAnswers( template );
			if ( slug ) {
				const title = defaultAnswers.slug === slug ?
					defaultAnswers.title :
					startCase( slug.replace( /-/, ' ' ) );
				const answers = {
					...defaultAnswers,
					slug,
					title,
				};
				await scaffold( template, answers );
			} else {
				const answers = await inquirer.prompt( getPrompts( template ) );
				await scaffold( template, {
					...defaultAnswers,
					...answers,
				} );
			}
		} catch ( e ) {
			if ( e instanceof CLIError ) {
				info( '' );
				error( e.message );
				process.exit( 1 );
			} else {
				throw e;
			}
		}
	} );

program.on( '--help', function() {
	info( '' );
	info( 'Examples:' );
	info( `  $ ${ commandName }` );
	info( `  $ ${ commandName } todo-list` );
	info( `  $ ${ commandName } --template es5 todo-list` );
} );

program.parse( process.argv );
