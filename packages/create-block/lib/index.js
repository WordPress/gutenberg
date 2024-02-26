/**
 * External dependencies
 */
const inquirer = require( 'inquirer' );
const { capitalCase } = require( 'change-case' );
const program = require( 'commander' );

/**
 * Internal dependencies
 */
const checkSystemRequirements = require( './check-system-requirements' );
const CLIError = require( './cli-error' );
const log = require( './log' );
const { engines, version } = require( '../package.json' );
const scaffold = require( './scaffold' );
const {
	getPluginTemplate,
	getDefaultValues,
	getPrompts,
} = require( './templates' );

const commandName = `wp-create-block`;
program
	.name( commandName )
	.description(
		'Generates PHP, JS and CSS code for registering a WordPress plugin with blocks.\n\n' +
			'[slug] is optional. When provided, it triggers the quick mode where ' +
			'it is used as the block slug used for its identification, the output ' +
			'location for scaffolded files, and the name of the WordPress plugin.' +
			'The rest of the configuration is set to all default values unless ' +
			'overridden with some options listed below.'
	)
	.version( version )
	.arguments( '[slug]' )
	.option(
		'-t, --template <name>',
		'project template type name; allowed values: "standard", "es5", the name of an external npm package, or the path to a local directory',
		'standard'
	)
	.option( '--namespace <value>', 'internal namespace for the block name' )
	.option(
		'--title <value>',
		'display title for the block and the WordPress plugin'
	)
	// The name "description" is used internally so it couldn't be used.
	.option(
		'--short-description <value>',
		'short description for the block and the WordPress plugin'
	)
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
	.option( '--no-plugin', 'scaffold only block files' )
	.option( '--variant <variant>', 'the variant of the template to use' )
	.action(
		async (
			slug,
			{
				plugin,
				category,
				namespace,
				shortDescription: description,
				template: templateName,
				title,
				wpScripts,
				wpEnv,
				variant,
			}
		) => {
			await checkSystemRequirements( engines );
			try {
				const pluginTemplate = await getPluginTemplate( templateName );
				const availableVariants = Object.keys(
					pluginTemplate.variants
				);
				if ( variant && ! availableVariants.includes( variant ) ) {
					if ( ! availableVariants.length ) {
						throw new CLIError(
							`"${ variant }" variant was selected. This template does not have any variants!`
						);
					}
					throw new CLIError(
						`"${ variant }" is not a valid variant for this template. Available variants are: ${ availableVariants.join(
							', '
						) }.`
					);
				}

				const optionsValues = Object.fromEntries(
					Object.entries( {
						plugin,
						category,
						description,
						namespace,
						title,
						wpScripts,
						wpEnv,
					} ).filter( ( [ , value ] ) => value !== undefined )
				);

				if ( slug ) {
					const defaultValues = getDefaultValues(
						pluginTemplate,
						variant
					);
					const answers = {
						...defaultValues,
						slug,
						// Transforms slug to title as a fallback.
						title: capitalCase( slug ),
						...optionsValues,
					};
					await scaffold( pluginTemplate, answers );
				} else {
					log.info( '' );
					log.info(
						plugin
							? "Let's customize your WordPress plugin with blocks:"
							: "Let's add a new block to your existing WordPress plugin:"
					);

					if ( ! variant && availableVariants.length > 1 ) {
						const result = await inquirer.prompt( {
							type: 'list',
							name: 'variant',
							message:
								'The template variant to use for this block:',
							choices: availableVariants,
						} );
						variant = result.variant;
					}

					const defaultValues = getDefaultValues(
						pluginTemplate,
						variant
					);

					const filterOptionsProvided = ( { name } ) =>
						! Object.keys( optionsValues ).includes( name );
					const blockPrompts = getPrompts(
						pluginTemplate,
						[
							'slug',
							'namespace',
							'title',
							'description',
							'dashicon',
							'category',
						],
						variant
					).filter( filterOptionsProvided );
					const blockAnswers = await inquirer.prompt( blockPrompts );

					const pluginAnswers = plugin
						? await inquirer
								.prompt( {
									type: 'confirm',
									name: 'configurePlugin',
									message:
										'Do you want to customize the WordPress plugin?',
									default: false,
								} )
								.then( async ( { configurePlugin } ) => {
									if ( ! configurePlugin ) {
										return {};
									}

									const pluginPrompts = getPrompts(
										pluginTemplate,
										[
											'pluginURI',
											'version',
											'author',
											'license',
											'licenseURI',
											'domainPath',
											'updateURI',
										],
										variant
									).filter( filterOptionsProvided );
									const result =
										await inquirer.prompt( pluginPrompts );
									return result;
								} )
						: {};

					await scaffold( pluginTemplate, {
						...defaultValues,
						...optionsValues,
						variant,
						...blockAnswers,
						...pluginAnswers,
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
