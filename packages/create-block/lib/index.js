/**
 * External dependencies
 */
const { confirm, select } = require( '@inquirer/prompts' );
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
	getDefaultValues,
	getProjectTemplate,
	runPrompts,
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
	.option( '--variant <variant>', 'the variant of the template to use' )
	.option( '--no-plugin', 'scaffold only block files' )
	.option(
		'--target-dir <directory>',
		'the directory where the files will be scaffolded, defaults to the slug'
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
	.option( '--textdomain <value>', 'text domain for internationalization' )
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
				targetDir,
				textdomain,
			}
		) => {
			try {
				await checkSystemRequirements( engines );

				const projectTemplate =
					await getProjectTemplate( templateName );
				const availableVariants = Object.keys(
					projectTemplate.variants
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
						targetDir,
						textdomain,
					} ).filter( ( [ , value ] ) => value !== undefined )
				);

				if ( slug ) {
					const defaultValues = getDefaultValues(
						projectTemplate,
						variant
					);
					const answers = {
						...defaultValues,
						slug,
						// Transforms slug to title as a fallback.
						title: capitalCase( slug ),
						...optionsValues,
						variant,
					};
					await scaffold( projectTemplate, answers );
				} else {
					log.info( '' );
					log.info(
						plugin
							? "Let's customize your WordPress plugin with blocks:"
							: "Let's add a new block to your existing WordPress plugin:"
					);

					if ( ! variant && availableVariants.length > 1 ) {
						variant = await select( {
							message:
								'The template variant to use for this block:',
							choices: availableVariants.map( ( value ) => ( {
								value,
							} ) ),
						} );
					}

					const defaultValues = getDefaultValues(
						projectTemplate,
						variant
					);

					const blockAnswers = await runPrompts(
						projectTemplate,
						[
							'slug',
							'namespace',
							'title',
							'description',
							'dashicon',
							'category',
							! plugin && ! textdomain && 'textdomain',
						].filter( Boolean ),
						variant,
						optionsValues
					);

					const pluginAnswers =
						plugin &&
						( await confirm( {
							message:
								'Do you want to customize the WordPress plugin?',
							default: false,
						} ) )
							? await runPrompts(
									projectTemplate,
									[
										'pluginURI',
										'version',
										'author',
										'license',
										'licenseURI',
										'domainPath',
										'updateURI',
									],
									variant,
									optionsValues
							  )
							: {};

					await scaffold( projectTemplate, {
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
				} else if ( error.name === 'ExitPromptError' ) {
					log.info( 'Cancelled.' );
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
		log.info(
			`  $ ${ commandName } todo-list --no-plugin --textdomain=my-plugin`
		);
	} )
	.parse( process.argv );
