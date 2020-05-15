/**
 * External dependencies
 */
const inquirer = require( 'inquirer' );
const program = require( 'commander' );
const { pickBy, startCase } = require( 'lodash' );

/**
 * Internal dependencies
 */
const checkSystemRequirements = require( './check-system-requirements' );
const CLIError = require( './cli-error' );
const log = require( './log' );
const { engines, version } = require( '../package.json' );
const scaffold = require( './scaffold' );
const { getDefaultValues, getPrompts } = require( './templates' );

const commandName = `wp-create-block`;
program
	.name( commandName )
	.description(
		'Generates PHP, JS and CSS code for registering a block for a WordPress plugin.\n\n' +
			'[slug] is optional. When provided it triggers the quick mode where ' +
			'it is used as the block slug used for its identification, the output ' +
			'location for scaffolded files, and the name of the WordPress plugin.' +
			'The rest of the configuration is set to all default values unless ' +
			'overridden with some of the options listed below.'
	)
	.version( version )
	.arguments( '[slug]' )
	.option(
		'-t, --template <name>',
		'template type name, allowed values: "es5", "esnext"',
		'esnext'
	)
	.option( '--namespace <value>', 'internal namespace for the block name' )
	.option( '--title <value>', 'display title for the block' )
	// The name "description" is used internally so it couldn't be used.
	.option( '--short-description <value>', 'short description for the block' )
	.option( '--category <name>', 'category name for the block' )
	.action(
		async (
			slug,
			{ category, namespace, shortDescription, template, title }
		) => {
			await checkSystemRequirements( engines );
			try {
				const defaultValues = await getDefaultValues( template );
				const optionsValues = pickBy( {
					category,
					description: shortDescription,
					namespace,
					title,
				} );
				if ( slug ) {
					const answers = {
						...defaultValues,
						slug,
						// Transforms slug to title as a fallback.
						title: startCase( slug ),
						...optionsValues,
					};
					await scaffold( template, answers );
				} else {
					const prompts = await getPrompts( template );
					const filteredPrompts = prompts.filter(
						( { name } ) =>
							! Object.keys( optionsValues ).includes( name )
					);
					const answers = await inquirer.prompt( filteredPrompts );

					await scaffold( template, {
						...defaultValues,
						...optionsValues,
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
		}
	)
	.on( '--help', function() {
		log.info( '' );
		log.info( 'Examples:' );
		log.info( `  $ ${ commandName }` );
		log.info( `  $ ${ commandName } todo-list` );
		log.info(
			`  $ ${ commandName } todo-list --template es5 --title "TODO List"`
		);
	} )
	.parse( process.argv );
