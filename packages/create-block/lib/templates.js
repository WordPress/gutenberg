/**
 * External dependencies
 */
const { command } = require( 'execa' );
const glob = require( 'fast-glob' );
const { readFile } = require( 'fs' ).promises;
const { fromPairs, isObject } = require( 'lodash' );
const { join } = require( 'path' );

/**
 * WordPress dependencies
 */
const lazyImport = require( '@wordpress/lazy-import' );

/**
 * Internal dependencies
 */
const CLIError = require( './cli-error' );
const { info } = require( './log' );
const prompts = require( './prompts' );

const predefinedBlockTemplates = {
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
	},
	esnext: {
		defaultValues: {
			slug: 'esnext-example',
			title: 'ESNext Example',
			description:
				'Example block written with ESNext standard and JSX support – build step required.',
			dashicon: 'smiley',
		},
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

const externalTemplateExists = async ( templateName ) => {
	try {
		await command( `npm view ${ templateName }` );
	} catch ( error ) {
		return false;
	}
	return true;
};

const getBlockTemplate = async ( templateName ) => {
	if ( predefinedBlockTemplates[ templateName ] ) {
		return {
			...predefinedBlockTemplates[ templateName ],
			outputTemplates: await getOutputTemplates(
				join( __dirname, 'templates', templateName )
			),
		};
	}
	if ( ! ( await externalTemplateExists( templateName ) ) ) {
		throw new CLIError(
			`Invalid block template type name: "${ templateName }". Allowed values: ` +
				Object.keys( predefinedBlockTemplates )
					.map( ( name ) => `"${ name }"` )
					.join( ', ' ) +
				', or an existing npm package name.'
		);
	}

	try {
		info( '' );
		info( 'Downloading template files. It might take some time...' );

		const { defaultValues = {}, templatesPath } = await lazyImport(
			templateName
		);
		if ( ! isObject( defaultValues ) || ! templatesPath ) {
			throw new Error();
		}

		return {
			defaultValues,
			outputTemplates: await getOutputTemplates( templatesPath ),
		};
	} catch ( error ) {
		throw new CLIError(
			`Invalid template definition provided in "${ templateName }" package.`
		);
	}
};

const getDefaultValues = ( blockTemplate ) => {
	return {
		namespace: 'create-block',
		category: 'widgets',
		author: 'The WordPress Contributors',
		license: 'GPL-2.0-or-later',
		licenseURI: 'https://www.gnu.org/licenses/gpl-2.0.html',
		version: '0.1.0',
		wpScripts: true,
		editorScript: 'file:./build/index.js',
		editorStyle: 'file:./build/index.css',
		style: 'file:./build/style-index.css',
		...blockTemplate.defaultValues,
	};
};

const getPrompts = ( blockTemplate ) => {
	const defaultValues = getDefaultValues( blockTemplate );
	return Object.keys( prompts ).map( ( promptName ) => {
		return {
			...prompts[ promptName ],
			default: defaultValues[ promptName ],
		};
	} );
};

module.exports = {
	getBlockTemplate,
	getDefaultValues,
	getPrompts,
};
