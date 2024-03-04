/**
 * External dependencies
 */
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

const predefinedPluginTemplates = {
	es5: {
		defaultValues: {
			slug: 'example-static-es5',
			title: 'Example Static (ES5)',
			description:
				'Example block scaffolded with Create Block tool – no build step required.',
			dashicon: 'smiley',
			supports: {
				html: false,
			},
			wpScripts: false,
			editorScript: null,
			editorStyle: null,
			style: null,
			viewStyle: null,
			viewScript: 'file:./view.js',
			example: {},
		},
		templatesPath: join( __dirname, 'templates', 'es5' ),
		variants: {
			static: {},
			dynamic: {
				slug: 'example-dynamic-es5',
				title: 'Example Dynamic (ES5)',
				render: 'file:./render.php',
			},
		},
	},
	standard: {
		defaultValues: {
			slug: 'example-static',
			title: 'Example Static',
			description: 'Example block scaffolded with Create Block tool.',
			dashicon: 'smiley',
			supports: {
				html: false,
			},
			viewScript: 'file:./view.js',
			example: {},
		},
		variants: {
			static: {},
			dynamic: {
				slug: 'example-dynamic',
				title: 'Example Dynamic',
				render: 'file:./render.php',
			},
		},
	},
};

const getOutputTemplates = async ( outputTemplatesPath ) => {
	const outputTemplatesFiles = await glob( '**/*.mustache', {
		cwd: outputTemplatesPath,
		dot: true,
	} );
	return Object.fromEntries(
		await Promise.all(
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
		)
	);
};

const getOutputAssets = async ( outputAssetsPath ) => {
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
	blockTemplatesPath,
	assetsPath,
	defaultValues = {},
	variants = {},
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
	}

	return {
		blockOutputTemplates: blockTemplatesPath
			? await getOutputTemplates( blockTemplatesPath )
			: {},
		pluginOutputTemplates: await getOutputTemplates( pluginTemplatesPath ),
		outputAssets: assetsPath ? await getOutputAssets( assetsPath ) : {},
		defaultValues,
		variants,
	};
};

const getPluginTemplate = async ( templateName ) => {
	if ( predefinedPluginTemplates[ templateName ] ) {
		return await configToTemplate(
			predefinedPluginTemplates[ templateName ]
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
				`Invalid block template loaded. Error: ${ error.message }`
			);
		}
	}

	if ( ! ( await externalTemplateExists( templateName ) ) ) {
		throw new CLIError(
			`Invalid plugin template type name: "${ templateName }". Allowed values: ` +
				Object.keys( predefinedPluginTemplates )
					.map( ( name ) => `"${ name }"` )
					.join( ', ' ) +
				', or an existing npm package name.'
		);
	}

	let tempCwd;

	try {
		info( '' );
		info( 'Downloading template files. It might take some time...' );

		tempCwd = await mkdtemp( join( tmpdir(), 'wp-create-block-' ) );

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
				`Invalid plugin template downloaded. Error: ${ error.message }`
			);
		}
	} finally {
		if ( tempCwd ) {
			rimraf( tempCwd );
		}
	}
};

const getDefaultValues = ( pluginTemplate, variant ) => {
	return {
		$schema: 'https://schemas.wp.org/trunk/block.json',
		apiVersion: 3,
		namespace: 'create-block',
		category: 'widgets',
		author: 'The WordPress Contributors',
		license: 'GPL-2.0-or-later',
		licenseURI: 'https://www.gnu.org/licenses/gpl-2.0.html',
		version: '0.1.0',
		wpScripts: true,
		customScripts: {},
		wpEnv: false,
		npmDependencies: [],
		folderName: './src',
		editorScript: 'file:./index.js',
		editorStyle: 'file:./index.css',
		style: 'file:./style-index.css',
		transformer: ( view ) => view,
		...pluginTemplate.defaultValues,
		...pluginTemplate.variants?.[ variant ],
		variantVars: getVariantVars( pluginTemplate.variants, variant ),
	};
};

const getPrompts = ( pluginTemplate, keys, variant ) => {
	const defaultValues = getDefaultValues( pluginTemplate, variant );
	return keys.map( ( promptName ) => {
		return {
			...prompts[ promptName ],
			default: defaultValues[ promptName ],
		};
	} );
};

const getVariantVars = ( variants, variant ) => {
	const variantVars = {};
	const variantNames = Object.keys( variants );
	if ( variantNames.length === 0 ) {
		return variantVars;
	}

	const currentVariant = variant ?? variantNames[ 0 ];
	for ( const variantName of variantNames ) {
		const key =
			variantName.charAt( 0 ).toUpperCase() + variantName.slice( 1 );
		variantVars[ `is${ key }Variant` ] = currentVariant === variantName;
	}

	return variantVars;
};

module.exports = {
	getPluginTemplate,
	getDefaultValues,
	getPrompts,
};
