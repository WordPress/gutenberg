/**
 * External dependencies
 */
const { command } = require( 'execa' );
const glob = require( 'fast-glob' );
const { resolve } = require( 'path' );
const { existsSync } = require( 'fs' );
const { mkdtemp, readFile } = require( 'fs' ).promises;
const { fromPairs, isObject } = require( 'lodash' );
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
			slug: 'es5-example',
			title: 'ES5 Example',
			description:
				'Example block written with ES5 standard and no JSX – no build step required.',
			dashicon: 'smiley',
			wpScripts: false,
			editorScript: 'file:./index.js',
			editorStyle: 'file:./editor.css',
			style: 'file:./style.css',
		},
		templatesPath: join( __dirname, 'templates', 'es5' ),
	},
	esnext: {
		defaultValues: {
			slug: 'esnext-example',
			title: 'ESNext Example',
			description:
				'Example block written with ESNext standard and JSX support – build step required.',
			dashicon: 'smiley',
			supports: {
				html: false,
			},
			folderName: 'src',
			editorScript: 'file:./index.js',
			editorStyle: 'file:./index.css',
			style: 'file:./style-index.css',
		},
		templatesPath: join( __dirname, 'templates', 'esnext', 'plugin' ),
		blockTemplatesPath: join( __dirname, 'templates', 'esnext', 'block' ),
	},
};

const getOutputTemplates = async ( outputTemplatesPath ) => {
	const outputTemplatesFiles = await glob( '**/*.mustache', {
		cwd: outputTemplatesPath,
		dot: true,
	} );
	return fromPairs(
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
	return fromPairs(
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
	assetsPath,
	blockTemplatesPath,
	defaultValues = {},
	templatesPath,
} ) => {
	if ( ! isObject( defaultValues ) || ! templatesPath ) {
		throw new CLIError( 'Template found but invalid definition provided.' );
	}

	return {
		blockOutputTemplates: blockTemplatesPath
			? await getOutputTemplates( blockTemplatesPath )
			: {},
		defaultValues,
		outputAssets: assetsPath ? await getOutputAssets( assetsPath ) : {},
		outputTemplates: await getOutputTemplates( templatesPath ),
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
			require( require.resolve( name, {
				paths: [ tempCwd ],
			} ) )
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

const getDefaultValues = ( pluginTemplate ) => {
	return {
		$schema: 'https://schemas.wp.org/trunk/block.json',
		apiVersion: 2,
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
		folderName: '.',
		editorScript: 'file:./build/index.js',
		editorStyle: 'file:./build/index.css',
		style: 'file:./build/style-index.css',
		...pluginTemplate.defaultValues,
	};
};

const getPrompts = ( pluginTemplate ) => {
	const defaultValues = getDefaultValues( pluginTemplate );
	return Object.keys( prompts ).map( ( promptName ) => {
		return {
			...prompts[ promptName ],
			default: defaultValues[ promptName ],
		};
	} );
};

module.exports = {
	getPluginTemplate,
	getDefaultValues,
	getPrompts,
};
