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
const { configureBlockAttributes } = require( './attributes-config' );

const commandName = `wp-create-project`;
program
	.name( commandName )
	.description(
		'Generates PHP, JS and CSS code for WordPress projects (plugins, themes, blocks, blueprints).\n\n' +
			'[slug] is optional. When provided, it triggers the quick mode where ' +
			'it is used as the project slug for identification, the output ' +
			'location for scaffolded files, and the name of the WordPress project.' +
			' The rest of the configuration is set to all default values unless ' +
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
	.option(
		'--type <type>',
		'project type; allowed values: "plugin", "theme", "block", "blueprint"',
		'plugin'
	)
	.option( '--no-plugin', 'scaffold only block files (legacy compatibility)' )
	.option( '--with-blocks', 'include block scaffolding for plugins/themes' )
	.option(
		'--target-dir <directory>',
		'the directory where the files will be scaffolded, defaults to the slug'
	)
	.option(
		'--namespace <value>',
		'namespace for blocks (not needed for themes/plugins)'
	)
	.option( '--title <value>', 'display title for the project' )
	.option(
		'--short-description <value>',
		'short description for the project'
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
	.option( '--landing-page <value>', 'landing page URL for blueprint' )
	.option(
		'--wp-version <value>',
		'preferred WordPress version for blueprint'
	)
	.option( '--php-version <value>', 'preferred PHP version for blueprint' )
	.option(
		'--plugins <value>',
		'comma-separated list of plugin slugs for blueprint'
	)
	.option(
		'--themes <value>',
		'comma-separated list of theme slugs for blueprint'
	)
	.option( '--site-title <value>', 'site title for blueprint (legacy)' )
	.option(
		'--site-options <value>',
		'site options JSON for blueprint (legacy)'
	)
	.option(
		'--constants <value>',
		'PHP constants JSON for blueprint (legacy)'
	)
	.option( '--blogname <value>', 'site title (blogname) for blueprint' )
	.option( '--blogdescription <value>', 'site tagline for blueprint' )
	.option( '--admin-email <value>', 'admin email for blueprint' )
	.option( '--start-of-week <value>', 'start of week (0-6) for blueprint' )
	.option( '--timezone <value>', 'timezone for blueprint' )
	.option( '--wp-debug', 'enable WP_DEBUG for blueprint' )
	.option( '--wp-debug-log', 'enable WP_DEBUG_LOG for blueprint' )
	.option( '--wp-debug-display', 'enable WP_DEBUG_DISPLAY for blueprint' )
	.option( '--script-debug', 'enable SCRIPT_DEBUG for blueprint' )
	.option( '--wp-cache', 'enable WP_CACHE for blueprint' )
	.option( '--disallow-file-edit', 'enable DISALLOW_FILE_EDIT for blueprint' )
	.option( '--wp-memory-limit <value>', 'WP memory limit for blueprint' )
	.option(
		'--extra-libraries <value>',
		'comma-separated extra libraries for blueprint'
	)
	.option( '--login', 'enable auto-login for blueprint' )
	.option( '--no-login', 'disable auto-login for blueprint' )
	.option( '--networking', 'enable networking support for blueprint' )
	.option( '--reset-data', 'reset data before running blueprint' )
	.option( '--meta-title <value>', 'blueprint title for metadata' )
	.option(
		'--meta-description <value>',
		'blueprint description for metadata'
	)
	.option( '--meta-author <value>', 'blueprint author for metadata' )
	.option( '--meta-categories <value>', 'blueprint categories for metadata' )
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
				type,
				withBlocks,
				landingPage,
				wpVersion,
				phpVersion,
				plugins,
				themes,
				siteTitle,
				siteOptions,
				constants,
				extraLibraries,
				login,
				networking,
				resetData,
				metaTitle,
				metaDescription,
				metaAuthor,
				metaCategories,
				blogname,
				blogdescription,
				adminEmail,
				startOfWeek,
				timezone,
				wpDebug,
				wpDebugLog,
				wpDebugDisplay,
				scriptDebug,
				wpCache,
				disallowFileEdit,
				wpMemoryLimit,
			}
		) => {
			try {
				await checkSystemRequirements( engines );

				// Handle legacy --no-plugin flag
				if ( plugin === false ) {
					type = 'block';
				}

				// Validate project type
				const validTypes = [ 'plugin', 'theme', 'block', 'blueprint' ];
				if ( ! validTypes.includes( type ) ) {
					throw new CLIError(
						`Invalid project type "${ type }". Allowed values: ${ validTypes.join(
							', '
						) }.`
					);
				}

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

				// Ensure type is set to default if not provided
				if ( ! type ) {
					type = 'plugin';
				}

				// Map CLI options to the appropriate prefixed properties based on project type
				const cliOptionsMap = {
					type,
					plugin: type === 'plugin',
					theme: type === 'theme',
					block: type === 'block',
					blueprint: type === 'blueprint',
					withBlocks,
					wpScripts,
					wpEnv,
					targetDir,

					// Map common CLI options to project-type-specific properties
					...( type === 'theme' && {
						themeSlug: slug,
						themeTitle: title,
						themeDescription: description,
						themeTextdomain: textdomain,
					} ),
					...( type === 'plugin' && {
						pluginSlug: slug,
						pluginTitle: title,
						pluginDescription: description,
						pluginTextdomain: textdomain,
					} ),
					...( type === 'block' && {
						blockSlug: slug,
						blockTitle: title,
						blockDescription: description,
						blockTextdomain: textdomain,
						blockCategory: category,
					} ),
					...( type === 'blueprint' && {
						blueprintSlug: slug,
						blueprintTitle: title,
						blueprintDescription: description,
						blueprintLandingPage: landingPage,
						blueprintWpVersion: wpVersion,
						blueprintPhpVersion: phpVersion,
						blueprintPlugins: plugins,
						blueprintThemes: themes,
						blueprintLogin: login,
						blueprintNetworking: networking,
						blueprintResetData: resetData,
						blueprintExtraLibraries: extraLibraries,
					} ),
					// Legacy options (keep for backward compatibility)
					category,
					description,
					title,
					textdomain,
					landingPage,
					wpVersion,
					phpVersion,
					plugins,
					themes,
					siteTitle,
					siteOptions,
					constants,
					extraLibraries,
					login,
					networking,
					resetData,
					metaTitle,
					metaDescription,
					metaAuthor,
					metaCategories,
					blogname,
					blogdescription,
					adminEmail,
					startOfWeek,
					timezone,
					wpDebug,
					wpDebugLog,
					wpDebugDisplay,
					scriptDebug,
					wpCache,
					disallowFileEdit,
					wpMemoryLimit,
				};

				const optionsValues = Object.fromEntries(
					Object.entries( cliOptionsMap ).filter(
						( [ , value ] ) => value !== undefined
					)
				);

				if ( slug ) {
					const defaultValues = getDefaultValues(
						projectTemplate,
						variant,
						type,
						optionsValues.blockVariant,
						optionsValues.withBlocks || false // Use actual withBlocks value
					);

					// Create project-type-specific answers with better defaults
					const typeSpecificAnswers = {};
					if ( type === 'theme' ) {
						typeSpecificAnswers.themeSlug = slug;
						typeSpecificAnswers.themeTitle =
							title || capitalCase( slug );
						typeSpecificAnswers.themeDescription =
							description || 'A custom WordPress theme.';
						typeSpecificAnswers.themeTextdomain = slug;
					} else if ( type === 'plugin' ) {
						typeSpecificAnswers.pluginSlug = slug;
						typeSpecificAnswers.pluginTitle =
							title || capitalCase( slug );
						typeSpecificAnswers.pluginDescription =
							description || 'A custom WordPress plugin.';
						typeSpecificAnswers.pluginTextdomain = slug;
					} else if ( type === 'block' ) {
						typeSpecificAnswers.blockSlug = slug;
						typeSpecificAnswers.blockTitle =
							title || capitalCase( slug );
						typeSpecificAnswers.blockDescription =
							description || 'A custom WordPress block.';
						typeSpecificAnswers.blockTextdomain = slug;
						typeSpecificAnswers.blockNamespace =
							namespace || 'create-project';
					} else if ( type === 'blueprint' ) {
						typeSpecificAnswers.blueprintSlug = slug;
						typeSpecificAnswers.blueprintTitle =
							title || capitalCase( slug );
						typeSpecificAnswers.blueprintDescription =
							description || 'A custom WordPress blueprint.';
					}

					let answers = {
						...defaultValues,
						// Legacy properties for backward compatibility
						slug,
						title: capitalCase( slug ),
						...optionsValues,
						...typeSpecificAnswers,
					};

					// If withBlocks is true, prompt for block details even in CLI mode
					if (
						answers.withBlocks &&
						( type === 'plugin' || type === 'theme' )
					) {
						log.info( '' );

						// Block variant prompt
						if ( ! answers.blockVariant ) {
							const blockVariant = await select( {
								message:
									'What type of block do you want to create?',
								choices: [
									{
										name: 'Static Block (saves content to database)',
										value: 'static',
									},
									{
										name: 'Dynamic Block (renders via PHP)',
										value: 'dynamic',
									},
								],
								default: 'static',
							} );
							answers.blockVariant = blockVariant;
						}

						// Core block prompts
						const coreBlockPrompts = [
							'blockSlug',
							'blockNamespace',
							'blockTitle',
							'blockDescription',
							'blockDashicon',
							'blockCategory',
							'blockTextdomain',
						].filter( Boolean );

						const blockAnswers = await runPrompts(
							projectTemplate,
							coreBlockPrompts,
							variant,
							{
								...answers,
							}
						);

						answers = {
							...answers,
							...blockAnswers,
						};
					}

					await scaffold( projectTemplate, answers );
				} else {
					log.info( '' );

					// Project type selection if not specified via --type flag
					if ( ! optionsValues.type ) {
						const projectType = await select( {
							message:
								'What type of project do you want to create?',
							choices: [
								{ name: 'Plugin', value: 'plugin' },
								{ name: 'Theme', value: 'theme' },
								{ name: 'Block', value: 'block' },
								{ name: 'Blueprint', value: 'blueprint' },
							],
							default: 'plugin',
						} );
						type = projectType;
						optionsValues.type = type;
						optionsValues.plugin = type === 'plugin';
						optionsValues.theme = type === 'theme';
						optionsValues.block = type === 'block';
						optionsValues.blueprint = type === 'blueprint';
					}

					// Ask about theme variant for themes first (affects other questions)
					if ( type === 'theme' && ! variant ) {
						variant = await select( {
							message:
								'What type of theme do you want to create?',
							choices: [
								{
									name: 'FSE Theme (Block-based)',
									value: 'fse',
								},
								{
									name: 'Classic Theme (PHP templates)',
									value: 'classic',
								},
							],
							default: 'fse',
						} );
					}

					// Handle block variants (static vs dynamic) for standalone blocks
					if ( type === 'block' && ! variant ) {
						variant = await select( {
							message:
								'What type of block do you want to create?',
							choices: [
								{
									name: 'Static Block (saves content to database)',
									value: 'static',
								},
								{
									name: 'Dynamic Block (renders via PHP)',
									value: 'dynamic',
								},
							],
							default: 'static',
						} );
					}

					if ( type === 'plugin' ) {
						log.info(
							withBlocks
								? "Let's customize your WordPress plugin with blocks:"
								: "Let's customize your WordPress plugin:"
						);
					} else if ( type === 'theme' ) {
						log.info(
							withBlocks
								? `Let's customize your WordPress ${
										variant === 'classic'
											? 'classic'
											: 'FSE'
								  } theme with blocks:`
								: `Let's customize your WordPress ${
										variant === 'classic'
											? 'classic'
											: 'FSE'
								  } theme:`
						);
					} else if ( type === 'blueprint' ) {
						log.info(
							"Let's create your WordPress Playground blueprint:"
						);
					} else {
						log.info( "Let's create your WordPress block:" );
					}

					// Step 1: Collect project-specific details (no block details yet)
					let projectPromptFields;

					if ( type === 'blueprint' ) {
						projectPromptFields = [
							'blueprintSlug',
							'blueprintTitle',
							'blueprintDescription',
							'landingPage',
							'wpVersion',
							'phpVersion',
							'login',
							'networking',
							'resetData',
						];
					} else if ( type === 'theme' ) {
						projectPromptFields = [
							'themeSlug',
							'themeTitle',
							'themeDescription',
							'themeTextdomain',
						];
					} else if ( type === 'plugin' ) {
						projectPromptFields = [
							'pluginSlug',
							'pluginTitle',
							'pluginDescription',
							'pluginTextdomain',
						];
					} else if ( type === 'block' ) {
						projectPromptFields = [
							'blockNamespace',
							'blockSlug',
							'blockTitle',
							'blockDescription',
							'blockTextdomain',
						];
					} else {
						projectPromptFields = [
							'projectNamespace',
							'slug',
							'title',
							'description',
						];
					}

					const projectAnswers = await runPrompts(
						projectTemplate,
						projectPromptFields,
						variant,
						optionsValues
					);

					// Step 2: Blueprint-specific configuration
					let blueprintAnswers = {};
					if ( type === 'blueprint' ) {
						log.info( '' );
						log.info(
							"Now let's configure your blueprint details:"
						);

						const blueprintDetailAnswers = await runPrompts(
							projectTemplate,
							[ 'plugins', 'themes', 'extraLibraries' ],
							variant,
							optionsValues
						);

						blueprintAnswers = {
							...blueprintAnswers,
							...blueprintDetailAnswers,
						};

						// Handle site options configuration
						const hasSiteOptionFlags =
							blogname ||
							blogdescription ||
							adminEmail ||
							startOfWeek ||
							timezone;
						const configureSiteOptions =
							hasSiteOptionFlags ||
							( await confirm( {
								message:
									'Do you want to configure site options?',
								default: false,
							} ) );

						if ( configureSiteOptions ) {
							let siteOptionsAnswers = {};

							if ( hasSiteOptionFlags ) {
								// Use CLI provided values
								if ( blogname ) {
									siteOptionsAnswers.blogname = blogname;
								}
								if ( blogdescription ) {
									siteOptionsAnswers.blogdescription =
										blogdescription;
								}
								if ( adminEmail ) {
									siteOptionsAnswers.adminEmail = adminEmail;
								}
								if ( startOfWeek ) {
									siteOptionsAnswers.startOfWeek =
										startOfWeek;
								}
								if ( timezone ) {
									siteOptionsAnswers.timezone = timezone;
								}
							} else {
								// Prompt for values
								siteOptionsAnswers = await runPrompts(
									projectTemplate,
									[
										'blogname',
										'blogdescription',
										'adminEmail',
										'startOfWeek',
										'timezone',
									],
									variant,
									optionsValues
								);
							}

							blueprintAnswers = {
								...blueprintAnswers,
								siteOptions: siteOptionsAnswers,
							};
						}

						// Handle constants configuration
						const hasConstantFlags =
							wpDebug ||
							wpDebugLog ||
							wpDebugDisplay ||
							scriptDebug ||
							wpCache ||
							disallowFileEdit ||
							wpMemoryLimit;
						const configureConstants =
							hasConstantFlags ||
							( await confirm( {
								message:
									'Do you want to configure PHP constants?',
								default: false,
							} ) );

						if ( configureConstants ) {
							let constantsAnswers = {};

							if ( hasConstantFlags ) {
								// Use CLI provided values
								if ( wpDebug !== undefined ) {
									constantsAnswers.wpDebug = wpDebug;
								}
								if ( wpDebugLog !== undefined ) {
									constantsAnswers.wpDebugLog = wpDebugLog;
								}
								if ( wpDebugDisplay !== undefined ) {
									constantsAnswers.wpDebugDisplay =
										wpDebugDisplay;
								}
								if ( scriptDebug !== undefined ) {
									constantsAnswers.scriptDebug = scriptDebug;
								}
								if ( wpCache !== undefined ) {
									constantsAnswers.wpCacheEnabled = wpCache;
								}
								if ( disallowFileEdit !== undefined ) {
									constantsAnswers.disallowFileEdit =
										disallowFileEdit;
								}
								if ( wpMemoryLimit ) {
									constantsAnswers.wpMemoryLimit =
										wpMemoryLimit;
								}
							} else {
								// Prompt for values
								constantsAnswers = await runPrompts(
									projectTemplate,
									[
										'wpDebug',
										'wpDebugLog',
										'wpDebugDisplay',
										'scriptDebug',
										'wpCacheEnabled',
										'disallowFileEdit',
										'wpMemoryLimit',
									],
									variant,
									optionsValues
								);
							}

							blueprintAnswers = {
								...blueprintAnswers,
								constants: constantsAnswers,
							};
						}

						// Ask about metadata
						const addMetadata = await confirm( {
							message:
								'Do you want to add metadata for the Blueprint Gallery?',
							default: false,
						} );

						if ( addMetadata ) {
							const metadataAnswers = await runPrompts(
								projectTemplate,
								[
									'metaTitle',
									'metaDescription',
									'metaAuthor',
									'metaCategories',
								],
								variant,
								optionsValues
							);
							blueprintAnswers = {
								...blueprintAnswers,
								...metadataAnswers,
							};
						}
					}

					// Step 2: Ask about blocks for plugins/themes
					if (
						( type === 'plugin' ||
							( type === 'theme' && variant === 'classic' ) ) &&
						withBlocks === undefined
					) {
						withBlocks = await confirm( {
							message: `Do you want to include block scaffolding in your ${ type }?`,
							default: type === 'plugin',
						} );
						optionsValues.withBlocks = withBlocks;
					} else if (
						type === 'theme' &&
						variant === 'fse' &&
						withBlocks === undefined
					) {
						withBlocks = await confirm( {
							message:
								'Do you want to add custom blocks to your FSE theme?',
							default: false,
						} );
						optionsValues.withBlocks = withBlocks;
					}

					// Step 3: Ask about block variant and details if including blocks
					let blockAnswers = {};
					if (
						withBlocks &&
						type !== 'blueprint' &&
						type !== 'block'
					) {
						log.info( '' );

						// Different messaging based on project type
						if ( type === 'theme' ) {
							log.info(
								"Let's add a new block to your WordPress theme:"
							);
						} else if ( type === 'plugin' ) {
							log.info(
								"Let's add a new block to your WordPress plugin:"
							);
						} else {
							log.info( "Let's create your WordPress block:" );
						}

						// Ask about block variant if including blocks
						if ( withBlocks && ! optionsValues.blockVariant ) {
							const blockVariant = await select( {
								message:
									'What type of block do you want to create?',
								choices: [
									{
										name: 'Static Block (saves content to database)',
										value: 'static',
									},
									{
										name: 'Dynamic Block (renders via PHP)',
										value: 'dynamic',
									},
								],
								default: 'static',
							} );

							optionsValues.blockVariant = blockVariant;
						}

						// Core block details - following @wordpress/create-block pattern
						const coreBlockPrompts = [
							'blockSlug',
							'blockNamespace',
							'blockTitle',
							'blockDescription',
							'blockDashicon',
							'blockCategory',
							// Add textdomain for standalone blocks or when not provided
							! ( type === 'plugin' || type === 'theme' ) &&
								! textdomain &&
								'blockTextdomain',
						].filter( Boolean );

						const coreBlockAnswers = await runPrompts(
							projectTemplate,
							coreBlockPrompts,
							variant,
							{
								...optionsValues,
								// Don't pass block prompts here - let them show with proper defaults
							}
						);

						blockAnswers = {
							...blockAnswers,
							...coreBlockAnswers,
						};

						// Optional: Configure Block Attributes
						const configureAttributes = await confirm( {
							message:
								'Do you want to add custom attributes to your block?',
							default: false,
						} );

						if ( configureAttributes ) {
							const attributes = await configureBlockAttributes(
								{}
							);
							blockAnswers.blockAttributes = attributes;
						}
					}

					// Optional parent project customization (following @wordpress/create-block pattern)
					let parentProjectAnswers = {};
					if ( type === 'plugin' || type === 'theme' ) {
						const customizeParent = await confirm( {
							message: `Do you want to customize the WordPress ${ type }?`,
							default: false,
						} );

						if ( customizeParent ) {
							const parentPrompts =
								type === 'plugin'
									? [
											'pluginURI',
											'version',
											'author',
											'license',
											'licenseURI',
											'domainPath',
											'updateURI',
									  ]
									: [
											'themeURI',
											'version',
											'author',
											'license',
											'licenseURI',
											'themeRequiresWP',
											'themeTags',
									  ];

							parentProjectAnswers = await runPrompts(
								projectTemplate,
								parentPrompts,
								variant,
								optionsValues
							);
						}
					}

					// Recompute defaults with final withBlocks value to fix wpScripts
					const finalDefaultValues = getDefaultValues(
						projectTemplate,
						variant,
						type,
						optionsValues.blockVariant,
						withBlocks,
						null // computedNamespace
					);

					await scaffold( projectTemplate, {
						...finalDefaultValues,
						...optionsValues,
						variant,
						blockVariant: optionsValues.blockVariant,
						...projectAnswers,
						...blueprintAnswers,
						...blockAnswers,
						...parentProjectAnswers,
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
		log.info( `  $ ${ commandName } my-plugin` );
		log.info( `  $ ${ commandName } my-theme --type theme` );
		log.info( `  $ ${ commandName } my-block --type block` );
		log.info(
			`  $ ${ commandName } my-plugin --type plugin --with-blocks`
		);
		log.info(
			`  $ ${ commandName } todo-list --template es5 --title "TODO List"`
		);
		log.info( `  $ ${ commandName } my-blueprint --type blueprint` );
		log.info(
			`  $ ${ commandName } playground-demo --type blueprint --plugins "hello-dolly,akismet" --themes "twentytwentythree"`
		);
	} )
	.parse( process.argv );
