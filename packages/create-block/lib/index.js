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
const {
	getBlockTemplate,
	getDefaultValues,
	getPrompts,
} = require( './templates' );

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
		'block template type name, allowed values: "es5", "esnext", or the name of an external npm package',
		'esnext'
	)
	.option( '--namespace <value>', 'internal namespace for the block name' )
	.option( '--title <value>', 'display title for the block' )
	// The name "description" is used internally so it couldn't be used.
	.option( '--short-description <value>', 'short description for the block' )
	.option( '--category <name>', 'category name for the block' )
	.option(
		'--wp-scripts',
		'enable integration with `@wordpress/scripts` package'
	)
	.option(
		'--no-wp-scripts',
		'disable integration with `@wordpress/scripts` package'
	)
	.option( '--wp-env', 'enable integration with `@wordpress/env` package' )
	.action(
		async (
			slug,
			{
				category,
				namespace,
				shortDescription: description,
				template: templateName,
				title,
				wpScripts,
				wpEnv,
			}
		) => {
			await checkSystemRequirements( engines );
			try {
				const blockTemplate = await getBlockTemplate( templateName );
				const defaultValues = getDefaultValues( blockTemplate );
				const optionsValues = pickBy(
					{
						category,
						description,
						namespace,
						title,
						wpScripts,
						wpEnv,
					},
					( value ) => value !== undefined
				);

				if ( slug ) {
					const answers = {
						...defaultValues,
						slug,
						// Transforms slug to title as a fallback.
						title: startCase( slug ),
						...optionsValues,
					};
					await scaffold( blockTemplate, answers );
				} else {
					const prompts = getPrompts( blockTemplate ).filter(
						( { name } ) =>
							! Object.keys( optionsValues ).includes( name )
					);
					log.info( '' );
					log.info( "Let's customize your block:" );
					const answers = await inquirer.prompt( prompts );
					await scaffold( blockTemplate, {
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
	.on( '--help', () => {
		log.info( '' );
		log.info( 'Examples:' );
		log.info( `  $ ${ commandName }` );
		log.info( `  $ ${ commandName } todo-list` );
		log.info(
			`  $ ${ commandName } todo-list --template es5 --title "TODO List"`
		);
	} )
	.parse( process.argv );
