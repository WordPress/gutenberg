/**
 * External dependencies
 */
const { pascalCase, snakeCase } = require( 'change-case' );
const { join } = require( 'path' );

/**
 * Internal dependencies
 */
const initBlock = require( './init-block' );
const initPackageJSON = require( './init-package-json' );
const initWPScripts = require( './init-wp-scripts' );
const initWPEnv = require( './init-wp-env' );
const { code, info, success, error } = require( './log' );
const { writeOutputAsset, writeOutputTemplate } = require( './output' );
const { getOutputTemplates, getOutputAssets } = require( './templates' );

module.exports = async (
	{
		pluginOutputTemplates,
		themeOutputTemplates,
		blockOutputTemplates,
		blueprintOutputTemplates,
		outputAssets,
	},
	{
		$schema,
		apiVersion,
		type,
		plugin,
		theme,
		block,
		blueprint,
		withBlocks,
		blockVariant,
		namespace,
		slug,
		title,
		description,
		dashicon,
		category,
		textdomain,
		attributes,
		supports,
		author,
		pluginURI,
		themeURI,
		license,
		licenseURI,
		domainPath,
		updateURI,
		version,
		requiresAtLeast,
		requiresWP,
		requiresPHP,
		testedUpTo,
		tags,
		// Theme-specific properties
		themeSlug,
		themeTitle,
		themeDescription,
		themeTextdomain,
		themeRequiresWP,
		themeTags,
		// Plugin-specific properties
		pluginSlug,
		pluginTitle,
		pluginDescription,
		pluginTextdomain,
		// Block-specific properties
		blockSlug,
		blockNamespace,
		blockTitle,
		blockDescription,
		blockTextdomain,
		blockCategory,
		blockDashicon,
		// Blueprint-specific properties
		blueprintSlug,
		blueprintTitle,
		blueprintDescription,
		wpScripts,
		wpEnv,
		npmDependencies,
		npmDevDependencies,
		customScripts,
		folderName,
		targetDir,
		editorScript,
		editorStyle,
		style,
		viewStyle,
		render,
		viewScriptModule,
		viewScript,
		variantVars,
		customPackageJSON,
		customBlockJSON,
		example,
		transformer,
		pluginTemplatesPath: variantPluginTemplatesPath,
		themeTemplatesPath: variantThemeTemplatesPath,
		blockTemplatesPath: variantBlockTemplatesPath,
		blueprintTemplatesPath: variantBlueprintTemplatesPath,
		assetsPath: variantAssetsPath,
		// Blueprint-specific fields - raw values from CLI/prompts
		landingPage,
		login,
		networking,
		resetData,
		wpVersion,
		phpVersion,
		plugins,
		themes,
		siteTitle,
		siteOptions,
		constants,
		extraLibraries,
		metaTitle,
		metaDescription,
		metaAuthor,
		metaCategories,
	}
) => {
	// Determine the main slug from project-type-specific properties
	let mainSlug;
	if ( type === 'theme' ) {
		mainSlug = themeSlug;
	} else if ( type === 'plugin' ) {
		mainSlug = pluginSlug;
	} else if ( type === 'block' ) {
		mainSlug = blockSlug;
	} else if ( type === 'blueprint' ) {
		mainSlug = blueprintSlug;
	} else {
		mainSlug = slug;
	}
	mainSlug = mainSlug || 'example-project';
	const rootDirectory = join( process.cwd(), targetDir || mainSlug );

	// Process blueprint-specific data
	let blueprintData = {};
	if ( type === 'blueprint' ) {
		// Parse plugin list - convert to proper schema format
		const pluginList = plugins
			? plugins
					.split( ',' )
					.map( ( p ) => p.trim() )
					.filter( Boolean )
			: [];

		// Parse theme list for installation steps
		const themeList = themes
			? themes
					.split( ',' )
					.map( ( t ) => t.trim() )
					.filter( Boolean )
			: [];

		// Parse site options
		let siteOptionsObj = {};
		if ( siteOptions ) {
			if ( typeof siteOptions === 'string' ) {
				try {
					siteOptionsObj = JSON.parse( siteOptions );
				} catch ( e ) {
					// If parsing fails, treat as empty object
				}
			} else if ( typeof siteOptions === 'object' ) {
				// Handle structured site options from prompts
				if ( siteOptions.blogname ) {
					siteOptionsObj.blogname = siteOptions.blogname;
				}
				if ( siteOptions.blogdescription ) {
					siteOptionsObj.blogdescription =
						siteOptions.blogdescription;
				}
				if ( siteOptions.adminEmail ) {
					siteOptionsObj.admin_email = siteOptions.adminEmail;
				}
				if ( siteOptions.startOfWeek ) {
					siteOptionsObj.start_of_week = siteOptions.startOfWeek;
				}
				if ( siteOptions.timezone ) {
					siteOptionsObj.timezone_string = siteOptions.timezone;
				}
			}
		}

		// Add site title to site options if provided (legacy support)
		if ( siteTitle && ! siteOptionsObj.blogname ) {
			siteOptionsObj.blogname = siteTitle;
		}

		// Parse constants
		let constantsObj = {};
		if ( constants ) {
			if ( typeof constants === 'string' ) {
				try {
					constantsObj = JSON.parse( constants );
				} catch ( e ) {
					// If parsing fails, treat as empty object
				}
			} else if ( typeof constants === 'object' ) {
				// Handle structured constants from prompts
				if ( constants.wpDebug !== undefined ) {
					constantsObj.WP_DEBUG = constants.wpDebug;
				}
				if ( constants.wpDebugLog !== undefined ) {
					constantsObj.WP_DEBUG_LOG = constants.wpDebugLog;
				}
				if ( constants.wpDebugDisplay !== undefined ) {
					constantsObj.WP_DEBUG_DISPLAY = constants.wpDebugDisplay;
				}
				if ( constants.scriptDebug !== undefined ) {
					// eslint-disable-next-line @wordpress/wp-global-usage
					constantsObj.SCRIPT_DEBUG = constants.scriptDebug;
				}
				if ( constants.wpCacheEnabled !== undefined ) {
					constantsObj.WP_CACHE = constants.wpCacheEnabled;
				}
				if ( constants.disallowFileEdit !== undefined ) {
					constantsObj.DISALLOW_FILE_EDIT =
						constants.disallowFileEdit;
				}
				if ( constants.wpMemoryLimit ) {
					constantsObj.WP_MEMORY_LIMIT = constants.wpMemoryLimit;
				}
			}
		}

		// Parse meta categories
		const metaCategoriesList = metaCategories
			? metaCategories
					.split( ',' )
					.map( ( c ) => c.trim() )
					.filter( Boolean )
			: [];

		// Parse extra libraries
		const extraLibrariesList = Array.isArray( extraLibraries )
			? extraLibraries
			: [];

		// Build preferred versions
		const preferredVersions = {
			php: phpVersion || 'latest',
			wp: wpVersion || 'latest',
		};

		// Build features
		const features = {
			networking: networking || false,
			...( networking && { intl: false } ), // Add intl only if networking is enabled
		};

		// Build meta object if any meta fields are provided
		let meta = null;
		if (
			metaTitle ||
			metaDescription ||
			metaAuthor ||
			metaCategoriesList.length > 0
		) {
			meta = {};
			if ( metaTitle ) {
				meta.title = metaTitle;
			}
			if ( metaDescription ) {
				meta.description = metaDescription;
			}
			if ( metaAuthor ) {
				meta.author = metaAuthor;
			}
			if ( metaCategoriesList.length > 0 ) {
				meta.categories = metaCategoriesList;
			}
		}

		// Build login object/boolean
		let loginValue = login;
		if ( typeof login === 'object' ) {
			loginValue = login;
		} else {
			loginValue = login || false;
		}

		// Build steps array - include resetData if requested, and theme installations
		const steps = [];
		if ( resetData ) {
			steps.push( { step: 'resetData' } );
		}

		// Add theme installation steps
		themeList.forEach( ( installThemeSlug ) => {
			steps.push( {
				step: 'installTheme',
				themeData: {
					resource: 'wordpress.org/themes',
					slug: installThemeSlug,
				},
				options: {
					activate: themeList.indexOf( installThemeSlug ) === 0, // Activate first theme
				},
			} );
		} );

		blueprintData = {
			landingPage: landingPage || '/wp-admin/',
			preferredVersions,
			features,
			extraLibraries: extraLibrariesList,
			constants: constantsObj,
			plugins: pluginList,
			siteOptions: siteOptionsObj,
			login: loginValue,
			resetData: resetData || false,
			steps,
			// JSON helpers for mustache template
			pluginsJson: JSON.stringify( pluginList ),
			siteOptionsJson:
				Object.keys( siteOptionsObj ).length > 0
					? JSON.stringify( siteOptionsObj )
					: null,
			constantsJson:
				Object.keys( constantsObj ).length > 0
					? JSON.stringify( constantsObj )
					: null,
			extraLibrariesJson:
				extraLibrariesList.length > 0
					? JSON.stringify( extraLibrariesList )
					: null,
			stepsJson: JSON.stringify( steps ),
			loginJson:
				typeof loginValue === 'object'
					? JSON.stringify( loginValue )
					: null,
			loginIsObject: typeof loginValue === 'object',
			meta: meta
				? {
						...meta,
						categoriesJson: meta.categories
							? JSON.stringify( meta.categories )
							: null,
				  }
				: null,
		};
	}

	const transformedValues = transformer( {
		$schema,
		apiVersion,
		type,
		plugin,
		theme,
		block,
		blueprint,
		withBlocks,
		blockVariant,
		namespace: (
			namespace ||
			( type === 'plugin' ? pluginSlug : themeSlug ) ||
			'create-project'
		).toLowerCase(),
		slug: mainSlug,
		title:
			title ||
			themeTitle ||
			pluginTitle ||
			blockTitle ||
			blueprintTitle ||
			'Example Project',
		description:
			description ||
			themeDescription ||
			pluginDescription ||
			blockDescription ||
			blueprintDescription ||
			'Example project scaffolded with Create Project tool.',
		dashicon,
		category,
		attributes,
		supports,
		author,
		pluginURI,
		themeURI,
		license,
		licenseURI,
		domainPath,
		updateURI,
		version,
		requiresAtLeast,
		requiresWP,
		requiresPHP,
		testedUpTo,
		tags,
		// Theme-specific properties
		themeSlug,
		themeTitle,
		themeDescription,
		themeTextdomain,
		themeRequiresWP,
		themeTags,
		// Plugin-specific properties
		pluginSlug,
		pluginTitle,
		pluginDescription,
		pluginTextdomain,
		// Block-specific properties
		blockSlug,
		blockNamespace,
		blockTitle,
		blockDescription,
		blockTextdomain,
		blockCategory,
		blockDashicon,
		// Blueprint-specific properties
		blueprintSlug,
		blueprintTitle,
		blueprintDescription,
		wpScripts,
		wpEnv,
		npmDependencies,
		npmDevDependencies,
		customScripts,
		folderName: folderName
			? folderName.replace( /\$slug/g, mainSlug )
			: './src',
		editorScript,
		editorStyle,
		style,
		viewStyle,
		render,
		viewScriptModule,
		viewScript,
		example,
		textdomain:
			textdomain ||
			themeTextdomain ||
			pluginTextdomain ||
			blockTextdomain ||
			mainSlug,
		targetDir,
		variantVars,
		customPackageJSON,
		customBlockJSON,
		rootDirectory,
		// Include blueprint data for blueprint projects
		...( type === 'blueprint' ? blueprintData : {} ),
	} );

	const view = {
		...transformedValues,
		// Legacy case conversions for backward compatibility
		namespaceSnakeCase: snakeCase(
			transformedValues.namespace ||
				( type === 'plugin'
					? transformedValues.pluginSlug
					: transformedValues.themeSlug ) ||
				'create-project'
		),
		namespacePascalCase: pascalCase(
			transformedValues.namespace ||
				( type === 'plugin'
					? transformedValues.pluginSlug
					: transformedValues.themeSlug ) ||
				'create-project'
		),
		slugSnakeCase: snakeCase( transformedValues.slug || mainSlug ),
		slugPascalCase: pascalCase( transformedValues.slug || mainSlug ),
		// New prefixed property case conversions (themes and plugins use their slug as namespace)
		...( transformedValues.themeSlug && {
			themeSlugSnakeCase: snakeCase( transformedValues.themeSlug ),
			themeSlugPascalCase: pascalCase( transformedValues.themeSlug ),
		} ),
		...( transformedValues.pluginSlug && {
			pluginSlugSnakeCase: snakeCase( transformedValues.pluginSlug ),
			pluginSlugPascalCase: pascalCase( transformedValues.pluginSlug ),
		} ),
		...( transformedValues.blockSlug && {
			blockSlugSnakeCase: snakeCase( transformedValues.blockSlug ),
			blockSlugPascalCase: pascalCase( transformedValues.blockSlug ),
		} ),
		...( transformedValues.blueprintSlug && {
			blueprintSlugSnakeCase: snakeCase(
				transformedValues.blueprintSlug
			),
			blueprintSlugPascalCase: pascalCase(
				transformedValues.blueprintSlug
			),
		} ),
		isPluginProject: type === 'plugin',
		isThemeProject: type === 'theme',
		isBlockProject: type === 'block',
		isBlueprintProject: type === 'blueprint',
		// Add block variant flags for template conditionals
		isStaticBlock: blockVariant === 'static' || ! blockVariant,
		isDynamicBlock: blockVariant === 'dynamic',
		...variantVars,
	};

	// Check for the pluginTemplates path in the variant
	if ( variantPluginTemplatesPath === null ) {
		pluginOutputTemplates = {};
	} else if ( variantPluginTemplatesPath ) {
		pluginOutputTemplates = await getOutputTemplates(
			variantPluginTemplatesPath
		);
	}

	// Check for the themeTemplates path in the variant
	if ( variantThemeTemplatesPath === null ) {
		themeOutputTemplates = {};
	} else if ( variantThemeTemplatesPath ) {
		themeOutputTemplates = await getOutputTemplates(
			variantThemeTemplatesPath
		);
	}

	// Check for the blockTemplatesPath path in the variant
	if ( variantBlockTemplatesPath === null ) {
		blockOutputTemplates = {};
	} else if ( variantBlockTemplatesPath ) {
		blockOutputTemplates = await getOutputTemplates(
			variantBlockTemplatesPath
		);
	}

	// Check for the blueprintTemplatesPath path in the variant
	if ( variantBlueprintTemplatesPath === null ) {
		blueprintOutputTemplates = {};
	} else if ( variantBlueprintTemplatesPath ) {
		blueprintOutputTemplates = await getOutputTemplates(
			variantBlueprintTemplatesPath
		);
	}

	// Check for the assetsPath
	if ( variantAssetsPath === null ) {
		outputAssets = {};
	} else if ( variantAssetsPath ) {
		outputAssets = await getOutputAssets( variantAssetsPath );
	}

	// Validate that we have the necessary templates for the project type
	if ( type === 'block' && Object.keys( blockOutputTemplates ) < 1 ) {
		error(
			'No block files found in the template. Please ensure that the template supports the blockTemplatesPath property.'
		);
		return;
	}

	if ( type === 'plugin' && Object.keys( pluginOutputTemplates ) < 1 ) {
		error(
			'No plugin files found in the template. Please ensure that the template supports the pluginTemplatesPath property.'
		);
		return;
	}

	if ( type === 'theme' && Object.keys( themeOutputTemplates ) < 1 ) {
		error(
			'No theme files found in the template. Please ensure that the template supports the themeTemplatesPath property.'
		);
		return;
	}

	if ( type === 'blueprint' && Object.keys( blueprintOutputTemplates ) < 1 ) {
		error(
			'No blueprint files found in the template. Please ensure that the template supports the blueprintTemplatesPath property.'
		);
		return;
	}

	// Determine if we need wpScripts based on project type and variant
	const needsWpScripts =
		wpScripts &&
		( type === 'plugin' ||
			( type === 'theme' &&
				( variantVars.isClassicVariant || withBlocks ) ) ||
			( type === 'block' && withBlocks ) );

	let projectTypeLabel = 'block';
	if ( type === 'plugin' ) {
		projectTypeLabel = 'plugin';
	}

	if ( type === 'theme' ) {
		projectTypeLabel = 'theme';
	}

	if ( type === 'blueprint' ) {
		projectTypeLabel = 'blueprint';
	}

	info( '' );
	info(
		`Creating a new WordPress ${ projectTypeLabel } in the ${ rootDirectory } directory.`
	);

	// Scaffold plugin files
	if ( type === 'plugin' ) {
		await Promise.all(
			Object.keys( pluginOutputTemplates ).map(
				async ( outputFile ) =>
					await writeOutputTemplate(
						pluginOutputTemplates[ outputFile ],
						outputFile,
						view
					)
			)
		);
	}

	// Scaffold theme files
	if ( type === 'theme' ) {
		await Promise.all(
			Object.keys( themeOutputTemplates ).map(
				async ( outputFile ) =>
					await writeOutputTemplate(
						themeOutputTemplates[ outputFile ],
						outputFile,
						view
					)
			)
		);
	}

	// Scaffold blueprint files
	if ( type === 'blueprint' ) {
		await Promise.all(
			Object.keys( blueprintOutputTemplates ).map(
				async ( outputFile ) =>
					await writeOutputTemplate(
						blueprintOutputTemplates[ outputFile ],
						outputFile,
						view
					)
			)
		);
	}

	// Scaffold assets
	await Promise.all(
		Object.keys( outputAssets ).map(
			async ( outputFile ) =>
				await writeOutputAsset(
					outputAssets[ outputFile ],
					outputFile,
					view
				)
		)
	);

	if ( type === 'block' || withBlocks ) {
		let blockView = view;
		if (
			( type === 'theme' || type === 'plugin' ) &&
			withBlocks &&
			view.blockSlug &&
			view.blockNamespace
		) {
			// Isolate block-specific properties, excluding parent theme/plugin properties
			const {
				themeURI: _parentThemeURI,
				themeRequiresWP: _parentThemeRequiresWP,
				themeTags: _parentThemeTags,
				pluginURI: _parentPluginURI,
				pluginDomainPath: _parentPluginDomainPath,
				pluginUpdateURI: _parentPluginUpdateURI,
				slug: _parentSlug,
				namespace: _parentNamespace,
				title: _parentTitle,
				description: _parentDescription,
				...cleanView
			} = view;

			blockView = {
				...cleanView,
				// Override with block-specific values
				slug: view.blockSlug,
				namespace: view.blockNamespace,
				title: view.blockTitle || view.blockSlug,
				description:
					view.blockDescription ||
					`Block for ${ view.blockTitle || view.blockSlug }`,
				textdomain: view.blockTextdomain || view.textdomain, // Use block's textdomain if available, otherwise parent's
				// Preserve block script properties
				blockEditorScript: view.blockEditorScript,
				blockEditorStyle: view.blockEditorStyle,
				blockStyle: view.blockStyle,
				blockViewStyle: view.blockViewStyle,
				blockViewScript: view.blockViewScript,
				blockRender: view.blockRender,
			};
		}
		await initBlock( blockOutputTemplates, blockView );
	}

	// Initialize package.json for plugins and themes that need build process
	if (
		type === 'plugin' ||
		( type === 'theme' && ( variantVars.isClassicVariant || withBlocks ) )
	) {
		await initPackageJSON( view );

		if ( needsWpScripts ) {
			await initWPScripts( view );
		}

		if ( wpEnv ) {
			await initWPEnv( view );
		}
	}

	info( '' );

	success(
		`Done: WordPress ${ projectTypeLabel } ${ title } bootstrapped in the ${ rootDirectory } directory.`
	);

	// Show available commands and next steps
	if ( needsWpScripts ) {
		info( '' );
		info( 'You can run several commands inside:' );
		info( '' );
		code( '  $ npm start' );
		info( '    Starts the build for development.' );
		info( '' );
		code( '  $ npm run build' );
		info( '    Builds the code for production.' );
		info( '' );
		code( '  $ npm run format' );
		info( '    Formats files.' );
		info( '' );
		code( '  $ npm run lint:css' );
		info( '    Lints CSS files.' );
		info( '' );
		code( '  $ npm run lint:js' );
		info( '    Lints JavaScript files.' );
		info( '' );
		code( '  $ npm run plugin-zip' );
		info( '    Creates a zip file for a WordPress plugin.' );
		info( '' );
		code( '  $ npm run packages-update' );
		info( '    Updates WordPress packages to the latest version.' );
		info( '' );
		info( 'To enter the directory type:' );
		info( '' );
		code( `  $ cd ${ slug }` );
	}

	if ( needsWpScripts ) {
		info( '' );
		info( 'You can start development with:' );
		info( '' );
		code( '  $ npm start' );
	}

	if (
		wpEnv &&
		( type === 'plugin' ||
			( type === 'theme' &&
				( variantVars.isClassicVariant || withBlocks ) ) )
	) {
		info( '' );
		info( 'You can start WordPress with:' );
		info( '' );
		code( '  $ npx wp-env start' );
	}

	// Additional instructions for different project types
	if ( type === 'block' ) {
		info( '' );
		info( 'Your standalone block is ready!' );
		info( 'To use it in a plugin or theme:' );
		info( '1. Copy the block files to your plugin/theme directory' );
		info(
			'2. Register the block in your PHP file using register_block_type()'
		);
		info( '3. Enqueue the block assets' );
	}

	if ( type === 'theme' && ! variantVars.isClassicVariant && ! withBlocks ) {
		info( '' );
		info( 'Your FSE theme is ready!' );
		info( 'Key files:' );
		info( '- theme.json: Configure your theme settings' );
		info( '- templates/: Block template files' );
		info( '- parts/: Reusable template parts' );
	}

	if ( withBlocks && ( type === 'plugin' || type === 'theme' ) ) {
		info( '' );
		info( `Your ${ type } with blocks is ready!` );
		if ( type === 'theme' ) {
			info(
				'Make sure to activate the theme and enable Gutenberg features in functions.php'
			);
		}
	}

	if ( type === 'blueprint' ) {
		info( '' );
		info( 'Your blueprint is ready! You can use it with:' );
		code(
			`  $ wp-playground --blueprint=./${
				targetDir || slug
			}/blueprint.json`
		);
		info( '' );
		info( 'Or upload it to a public URL and use:' );
		info( '  https://playground.wordpress.net/?blueprint-url=<YOUR_URL>' );
		info( '' );
		info( 'Learn more about blueprints:' );
		info( '  https://github.com/WordPress/blueprints' );
	}

	info( '' );
	info( 'Code is Poetry' );
};
