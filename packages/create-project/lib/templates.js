/**
 * External dependencies
 */
const inquirer = require( '@inquirer/prompts' );
const { command } = require( 'execa' );
const glob = require( 'fast-glob' );
const { resolve } = require( 'path' );
const { existsSync } = require( 'fs' );
const { mkdtemp, readFile } = require( 'fs' ).promises;
const npmPackageArg = require( 'npm-package-arg' );
const { tmpdir } = require( 'os' );
const { join } = require( 'path' );
const rimraf = require( 'rimraf' ).sync;

/**
 * Internal dependencies
 */
const CLIError = require( './cli-error' );
const { info } = require( './log' );
const prompts = require( './prompts' );

const predefinedProjectTemplates = {
	es5: {
		defaultValues: {
			pluginSlug: 'example-plugin-es5',
			pluginTitle: 'Example Plugin (ES5)',
			themeSlug: 'example-theme-es5',
			themeTitle: 'Example Theme (ES5)',
			blockSlug: 'example-block-es5',
			blockTitle: 'Example Block (ES5)',
			blueprintSlug: 'example-blueprint-es5',
			blueprintTitle: 'Example Blueprint (ES5)',
			description:
				'Example project scaffolded with Create Project tool – no build step required.',
			blockDashicon: 'smiley',
			blockSupports: {
				html: false,
			},
			wpScripts: false,
			blockEditorScript: null,
			blockEditorStyle: null,
			blockStyle: null,
			blockViewStyle: null,
			blockViewScript: 'file:./view.js',
			blockExample: {},
		},
		templatesPath: join( __dirname, 'templates', 'es5' ),
		variants: {
			plugin: {
				pluginSlug: 'example-plugin-es5',
				pluginTitle: 'Example Plugin (ES5)',
			},
			theme: {
				themeSlug: 'example-theme-es5',
				themeTitle: 'Example Theme (ES5)',
			},
			block: {
				blockSlug: 'example-block-es5',
				blockTitle: 'Example Block (ES5)',
				static: {},
				dynamic: {
					blockSlug: 'example-dynamic-block-es5',
					blockTitle: 'Example Dynamic Block (ES5)',
					blockRender: 'file:./render.php',
				},
			},
		},
	},
	standard: {
		defaultValues: {
			pluginSlug: 'example-plugin',
			pluginTitle: 'Example Plugin',
			themeSlug: 'example-theme',
			themeTitle: 'Example Theme',
			blockSlug: 'example-block',
			blockTitle: 'Example Block',
			blueprintSlug: 'example-blueprint',
			blueprintTitle: 'Example Blueprint',
			description: 'Example project scaffolded with Create Project tool.',
			blockDashicon: 'smiley',
			blockSupports: {
				html: false,
			},
			blockViewScript: 'file:./view.js',
			blockExample: {},
			folderName: './src/$slug',
		},
		variants: {
			plugin: {
				pluginSlug: 'example-plugin',
				pluginTitle: 'Example Plugin',
			},
			theme: {
				themeSlug: 'example-theme',
				themeTitle: 'Example Theme',
			},
			fse: {
				themeSlug: 'example-fse-theme',
				themeTitle: 'Example FSE Theme',
			},
			classic: {
				themeSlug: 'example-classic-theme',
				themeTitle: 'Example Classic Theme',
				wpScripts: true,
			},
			block: {
				blockSlug: 'example-block',
				blockTitle: 'Example Block',
				static: {},
				dynamic: {
					blockSlug: 'example-dynamic-block',
					blockTitle: 'Example Dynamic Block',
					blockRender: 'file:./render.php',
				},
			},
		},
	},
};

const getOutputTemplates = async ( outputTemplatesPaths ) => {
	// Handle single path (backwards compatibility) or array of paths
	const paths = Array.isArray( outputTemplatesPaths )
		? outputTemplatesPaths
		: [ outputTemplatesPaths ];

	const allTemplates = {};

	// Process each path in order (later paths override earlier ones)
	for ( const outputTemplatesPath of paths ) {
		if ( ! outputTemplatesPath || ! existsSync( outputTemplatesPath ) ) {
			continue;
		}

		const outputTemplatesFiles = await glob( '**/*.mustache', {
			cwd: outputTemplatesPath,
			dot: true,
		} );

		const pathTemplates = await Promise.all(
			outputTemplatesFiles.map( async ( outputTemplateFile ) => {
				const outputFile = outputTemplateFile.replace(
					/\.mustache$/,
					''
				);
				const outputTemplate = await readFile(
					join( outputTemplatesPath, outputTemplateFile ),
					'utf8'
				);
				return [ outputFile, outputTemplate ];
			} )
		);

		// Merge templates, with later paths overriding earlier ones
		Object.assign( allTemplates, Object.fromEntries( pathTemplates ) );
	}

	return allTemplates;
};

const getOutputAssets = async ( outputAssetsPath ) => {
	if ( ! outputAssetsPath || ! existsSync( outputAssetsPath ) ) {
		return {};
	}

	const outputAssetFiles = await glob( '**/*', {
		cwd: outputAssetsPath,
		dot: true,
	} );
	return Object.fromEntries(
		await Promise.all(
			outputAssetFiles.map( async ( outputAssetFile ) => {
				const outputAsset = await readFile(
					join( outputAssetsPath, outputAssetFile )
				);
				return [ outputAssetFile, outputAsset ];
			} )
		)
	);
};

const externalTemplateExists = async ( templateName ) => {
	try {
		await command( `npm view ${ templateName }` );
	} catch ( error ) {
		return false;
	}
	return true;
};

const configToTemplate = async ( {
	pluginTemplatesPath,
	themeTemplatesPath,
	blockTemplatesPath,
	blueprintTemplatesPath,
	assetsPath,
	defaultValues = {},
	variants = {},
	themeVariant = 'fse',
	withBlocks = false,
	...deprecated
} ) => {
	if ( defaultValues === null || typeof defaultValues !== 'object' ) {
		throw new CLIError( 'Template found but invalid definition provided.' );
	}

	if ( deprecated.templatesPath ) {
		pluginTemplatesPath = deprecated.templatesPath;
		defaultValues = {
			folderName: '.',
			editorScript: 'file:./build/index.js',
			editorStyle: 'file:./build/index.css',
			style: 'file:./build/style-index.css',
			...defaultValues,
		};
	} else {
		pluginTemplatesPath =
			pluginTemplatesPath || join( __dirname, 'templates', 'plugin' );
		blockTemplatesPath =
			blockTemplatesPath || join( __dirname, 'templates', 'block' );
		blueprintTemplatesPath =
			blueprintTemplatesPath ||
			join( __dirname, 'templates', 'blueprint' );

		// For themes, use the new multi-path system
		if ( themeTemplatesPath ) {
			// Use provided path as-is for backwards compatibility
			themeTemplatesPath = [ themeTemplatesPath ];
		} else {
			// Use the new common/variant structure
			themeTemplatesPath = getThemeTemplatePaths(
				themeVariant,
				withBlocks
			);
		}
	}

	return {
		pluginOutputTemplates: await getOutputTemplates( pluginTemplatesPath ),
		themeOutputTemplates: await getOutputTemplates( themeTemplatesPath ),
		blockOutputTemplates: await getOutputTemplates( blockTemplatesPath ),
		blueprintOutputTemplates: await getOutputTemplates(
			blueprintTemplatesPath
		),
		outputAssets: assetsPath ? await getOutputAssets( assetsPath ) : {},
		defaultValues,
		variants,
	};
};

const getThemeTemplatePaths = ( variant = 'fse', withBlocks = false ) => {
	const basePath = join( __dirname, 'templates' );
	const themePath = join( basePath, 'theme' );
	const paths = [];

	const commonPath = join( themePath, 'common' );
	if ( existsSync( commonPath ) ) {
		paths.push( commonPath );
	}

	const variantPath = join( themePath, variant );
	if ( existsSync( variantPath ) ) {
		paths.push( variantPath );
	}

	if ( withBlocks ) {
		const blocksPath = join( basePath, 'blocks' );
		if ( existsSync( blocksPath ) ) {
			paths.push( blocksPath );
		}
	}

	return paths;
};

const getProjectTemplate = async ( templateName ) => {
	if ( predefinedProjectTemplates[ templateName ] ) {
		return await configToTemplate(
			predefinedProjectTemplates[ templateName ]
		);
	}

	try {
		if ( existsSync( resolve( templateName ) ) ) {
			return await configToTemplate( require( resolve( templateName ) ) );
		}
		return await configToTemplate( require( templateName ) );
	} catch ( error ) {
		if ( error instanceof CLIError ) {
			throw error;
		} else if ( error.code !== 'MODULE_NOT_FOUND' ) {
			throw new CLIError(
				`Invalid project template loaded. Error: ${ error.message }`
			);
		}
	}

	if ( ! ( await externalTemplateExists( templateName ) ) ) {
		throw new CLIError(
			`Invalid project template type name: "${ templateName }". Allowed values: ` +
				Object.keys( predefinedProjectTemplates )
					.map( ( name ) => `"${ name }"` )
					.join( ', ' ) +
				', or an existing npm package name.'
		);
	}

	let tempCwd;

	try {
		info( '' );
		info( 'Downloading template files. It might take some time...' );

		tempCwd = await mkdtemp( join( tmpdir(), 'wp-create-project-' ) );

		await command( `npm install ${ templateName } --no-save`, {
			cwd: tempCwd,
		} );

		const { name } = npmPackageArg( templateName );
		return await configToTemplate(
			require(
				require.resolve( name, {
					paths: [ tempCwd ],
				} )
			)
		);
	} catch ( error ) {
		if ( error instanceof CLIError ) {
			throw error;
		} else {
			throw new CLIError(
				`Invalid project template downloaded. Error: ${ error.message }`
			);
		}
	} finally {
		if ( tempCwd ) {
			rimraf( tempCwd );
		}
	}
};

const getDefaultValues = (
	projectTemplate,
	variant,
	projectType = 'plugin',
	blockVariant = null,
	withBlocks = false,
	computedNamespace = null
) => {
	const baseDefaults = {
		$schema: 'https://schemas.wp.org/trunk/block.json',
		apiVersion: 3,
		author: 'The WordPress Contributors',
		license: 'GPL-2.0-or-later',
		licenseURI: 'https://www.gnu.org/licenses/gpl-2.0.html',
		version: '0.1.0',
		requiresAtLeast: '6.7',
		requiresPHP: '7.4',
		testedUpTo: '6.7',
		wpScripts: true,
		customScripts: {},
		wpEnv: false,
		npmDependencies: [],
		folderName: './src',
		transformer: ( view ) => view,
		// Project type specific defaults
		type: projectType,
		plugin: projectType === 'plugin',
		theme: projectType === 'theme',
		block: projectType === 'block',
		withBlocks,
		// Block-specific defaults
		blockCategory: 'widgets',
		blockEditorScript: 'file:./index.js',
		blockEditorStyle: 'file:./index.css',
		blockStyle: 'file:./style-index.css',
	};

	// Project type specific configurations
	if ( projectType === 'theme' ) {
		// Set variant-aware defaults
		if ( variant === 'fse' ) {
			baseDefaults.themeSlug = 'example-fse-theme';
			baseDefaults.themeTitle = 'Example FSE Theme';
			baseDefaults.themeDescription =
				'A modern block-based WordPress theme.';
			baseDefaults.folderName = './blocks';
			baseDefaults.wpScripts = withBlocks;
			baseDefaults.themeTags =
				'block-themes, full-site-editing, custom-colors, custom-spacing';
		} else if ( variant === 'classic' ) {
			baseDefaults.themeSlug = 'example-classic-theme';
			baseDefaults.themeTitle = 'Example Classic Theme';
			baseDefaults.themeDescription =
				'A traditional WordPress theme with modern tooling.';
			baseDefaults.folderName = './assets';
			baseDefaults.wpScripts = true;
			baseDefaults.themeTags =
				'custom-background, custom-colors, custom-header, custom-menu';
		} else {
			// Default theme values
			baseDefaults.themeSlug = 'example-theme';
			baseDefaults.themeTitle = 'Example Theme';
			baseDefaults.themeDescription =
				'Example theme scaffolded with Create Project tool.';
			baseDefaults.folderName = './src';
		}

		baseDefaults.themeURI = '';
		baseDefaults.themeRequiresWP = '6.7';
		baseDefaults.themeTextdomain = baseDefaults.themeSlug;

		// Block-specific defaults for themes with blocks
		if ( withBlocks ) {
			baseDefaults.blockSlug = 'custom-block';
			baseDefaults.blockTitle = 'Custom Block';
			baseDefaults.blockDescription = `Custom block for ${ baseDefaults.themeTitle }.`;
			baseDefaults.blockNamespace =
				computedNamespace || baseDefaults.themeSlug;
			baseDefaults.blockTextdomain = baseDefaults.themeSlug;
			baseDefaults.wpScripts = true;
		}
	} else if ( projectType === 'plugin' ) {
		baseDefaults.pluginSlug = 'example-plugin';
		baseDefaults.pluginTitle = 'Example Plugin';
		baseDefaults.pluginDescription =
			'Example plugin scaffolded with Create Project tool.';
		baseDefaults.pluginURI = '';
		baseDefaults.pluginTextdomain = 'example-plugin';
		baseDefaults.pluginDomainPath = '/languages';
		baseDefaults.pluginUpdateURI = '';

		// Block-specific defaults for plugins with blocks
		if ( withBlocks ) {
			baseDefaults.blockSlug = 'custom-block';
			baseDefaults.blockTitle = 'Custom Block';
			baseDefaults.blockDescription = `Custom block for ${ baseDefaults.pluginTitle }.`;
			baseDefaults.blockNamespace =
				computedNamespace || baseDefaults.pluginSlug;
			baseDefaults.blockTextdomain = baseDefaults.pluginSlug;
			baseDefaults.wpScripts = true;
		}
	} else if ( projectType === 'block' ) {
		// Standalone block in root
		if ( blockVariant === 'dynamic' ) {
			baseDefaults.blockSlug = 'custom-dynamic-block';
			baseDefaults.blockTitle = 'Custom Dynamic Block';
			baseDefaults.blockDescription =
				'A dynamic block that renders server-side.';
			baseDefaults.blockRender = 'file:./render.php';
		} else {
			baseDefaults.blockSlug = 'custom-block';
			baseDefaults.blockTitle = 'Custom Block';
			baseDefaults.blockDescription =
				'A static block that saves content to the database.';
		}
		baseDefaults.blockNamespace = computedNamespace || 'create-project';
		baseDefaults.folderName = '.';
		baseDefaults.wpScripts = true;
		baseDefaults.blockTextdomain = baseDefaults.blockSlug;
	} else if ( projectType === 'blueprint' ) {
		// Defaults for blueprints
		baseDefaults.blueprintSlug = 'example-blueprint';
		baseDefaults.blueprintTitle = 'Example Blueprint';
		baseDefaults.blueprintDescription =
			'Example blueprint scaffolded with Create Project tool.';
		baseDefaults.blueprintLandingPage = '/wp-admin/';
		baseDefaults.blueprintLogin = true;
		baseDefaults.blueprintPreferredVersions = {
			php: 'latest',
			wp: 'latest',
		};
		baseDefaults.blueprintFeatures = { networking: false, intl: false };
		baseDefaults.blueprintExtraLibraries = [];
		baseDefaults.blueprintConstants = {};
		baseDefaults.blueprintPlugins = '';
		baseDefaults.blueprintThemes = '';
		baseDefaults.blueprintSiteOptions = {};
		baseDefaults.blueprintResetData = false;
		baseDefaults.blueprintSteps = [];
		baseDefaults.blueprintMeta = null;
		baseDefaults.wpScripts = false;
	}

	return {
		...baseDefaults,
		...projectTemplate.defaultValues,
		...projectTemplate.variants?.[ variant ],
		blockVariant,
		variantVars: getVariantVars(
			projectTemplate.variants,
			variant,
			projectType,
			blockVariant
		),
	};
};

const runPrompts = async (
	projectTemplate,
	promptNames,
	variant,
	optionsValues
) => {
	const defaultValues = getDefaultValues(
		projectTemplate,
		variant,
		optionsValues.type,
		optionsValues.blockVariant,
		optionsValues.withBlocks,
		null // No computed namespace in runPrompts context
	);
	const result = {};
	for ( const promptName of promptNames ) {
		if ( Object.keys( optionsValues ).includes( promptName ) ) {
			continue;
		}

		const { type, ...config } = prompts[ promptName ];
		if ( ! type ) {
			continue; // Skip if prompt doesn't exist
		}

		result[ promptName ] = await inquirer[ type ]( {
			...config,
			default: defaultValues[ promptName ],
		} );
	}

	return result;
};

const getVariantVars = ( variants, variant, projectType, blockVariant ) => {
	const variantVars = {};

	// Handle project type variants
	variantVars.isPluginProject = projectType === 'plugin';
	variantVars.isThemeProject = projectType === 'theme';
	variantVars.isBlockProject = projectType === 'block';

	// Handle theme variants specifically
	if ( projectType === 'theme' ) {
		variantVars.isFseVariant =
			variant === 'fse' || variant === 'static' || ! variant;
		variantVars.isClassicVariant = variant === 'classic';
	}

	// Handle block variants specifically
	if ( projectType === 'block' ) {
		variantVars.isStaticVariant = variant === 'static' || ! variant;
		variantVars.isDynamicVariant = variant === 'dynamic';
	}

	// Handle block variants for projects with blocks
	if ( blockVariant ) {
		variantVars.isStaticBlockVariant = blockVariant === 'static';
		variantVars.isDynamicBlockVariant = blockVariant === 'dynamic';
	}

	// Generic variant handling for other cases
	const variantNames = Object.keys( variants );
	if ( variantNames.length > 0 ) {
		const currentVariant = variant ?? variantNames[ 0 ];
		for ( const variantName of variantNames ) {
			const key =
				variantName.charAt( 0 ).toUpperCase() + variantName.slice( 1 );
			variantVars[ `is${ key }Variant` ] = currentVariant === variantName;
		}
	}

	return variantVars;
};

module.exports = {
	getDefaultValues,
	getProjectTemplate,
	runPrompts,
	getOutputTemplates,
	getOutputAssets,
	getThemeTemplatePaths,
};
