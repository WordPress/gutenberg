/**
 * External dependencies
 */
const glob = require( 'fast-glob' );
const { readFile } = require( 'fs' ).promises;
const { fromPairs } = require( 'lodash' );
const { join } = require( 'path' );

/**
 * Internal dependencies
 */
const CLIError = require( './cli-error' );
const prompts = require( './prompts' );

const predefinedBlockTemplates = {
	es5: {
		defaultValues: {
			slug: 'es5-example',
			title: 'ES5 Example',
			description:
				'Example block written with ES5 standard and no JSX – no build step required.',
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
		},
	},
};

const getOutputTemplates = async ( name ) => {
	const outputTemplatesPath = join( __dirname, 'templates', name );
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

const getBlockTemplate = async ( templateName ) => {
	if ( ! predefinedBlockTemplates[ templateName ] ) {
		throw new CLIError(
			`Invalid block template type name. Allowed values: ${ Object.keys(
				predefinedBlockTemplates
			).join( ', ' ) }.`
		);
	}
	return {
		...predefinedBlockTemplates[ templateName ],
		outputTemplates: await getOutputTemplates( templateName ),
	};
};

const getDefaultValues = ( blockTemplate ) => {
	return {
		namespace: 'create-block',
		dashicon: 'smiley',
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
