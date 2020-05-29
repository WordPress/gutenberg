/**
 * External dependencies
 */
const glob = require( 'fast-glob' );
const { readFile } = require( 'fs' ).promises;
const { fromPairs } = require( 'lodash' );
const { join } = require( 'path' );
const { command } = require( 'execa' );
const { existsSync } = require( 'fs' );
const makeDir = require( 'make-dir' );
const os = require( 'os' );
const { v4: uuid } = require( 'uuid' );

/**
 * Internal dependencies
 */
const CLIError = require( './cli-error' );
const prompts = require( './prompts' );
const log = require( './log' );

const predefinedBlockTemplates = {
	es5: {
		defaultValues: {
			slug: 'es5-example',
			title: 'ES5 Example',
			description:
				'Example block written with ES5 standard and no JSX – no build step required.',
		},
		wpScripts: false,
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
	const outputTemplatesPath = isPredefinedTemplate( name )
		? join( __dirname, 'templates', name )
		: join( tempFolder, 'node_modules', name );

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

const tempFolder = join( os.tmpdir(), uuid() );

const getBlockTemplate = async ( templateName ) => {
	if ( predefinedBlockTemplates[ templateName ] ) {
		return {
			...predefinedBlockTemplates[ templateName ],
			outputTemplates: await getOutputTemplates( templateName ),
		};
	}

	// throw a CLIError if the the template is neither a core one nor an external one
	if ( ! ( await isExternalTemplate( templateName ) ) ) {
		throw new CLIError(
			`Invalid template type name. Provide either a valid npm package name, or use one of the Core templates: ${ Object.keys(
				predefinedBlockTemplates
			).join( ', ' ) }.`
		);
	}

	const packageInfo = await downloadExternalTemplate( templateName );

	return {
		...packageInfo,
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
		...blockTemplate.defaultValues,
	};
};

const getOutputFiles = async ( templateName ) => {
	const template = await getBlockTemplate( templateName );
	return template.outputTemplates;
};

const getPrompts = async ( templateName ) => {
	const defaultValues = await getDefaultValues( templateName );
	return Object.keys( prompts ).map( ( promptName ) => {
		return {
			...prompts[ promptName ],
			default: defaultValues[ promptName ],
		};
	} );
};

const hasWPScriptsEnabled = ( blockTemplate ) => {
	return blockTemplate.wpScripts !== false;
};

const isPredefinedTemplate = ( templateName ) =>
	predefinedBlockTemplates[ templateName ] || false;

const isExternalTemplate = async ( templateName ) => {
	try {
		await command( `npm view ${ templateName }` );
		return true;
	} catch ( error ) {
		return false;
	}
};

const downloadExternalTemplate = async ( templateName ) => {
	try {
		const cwd = tempFolder;

		if ( existsSync( join( cwd, 'node_modules', templateName ) ) ) {
			const rawPackageInfo = await readFile(
				join(
					tempFolder,
					'node_modules',
					templateName,
					'template.json'
				)
			);
			const packageInfo = JSON.parse( rawPackageInfo );

			return packageInfo;
		}

		await makeDir( cwd );
		await command( 'npm init -y', { cwd } );
		await command( `npm install ${ templateName } --save`, { cwd } );

		const rawPackageInfo = await readFile(
			join( tempFolder, 'node_modules', templateName, 'template.json' )
		);
		const packageInfo = JSON.parse( rawPackageInfo );

		return packageInfo;
	} catch ( error ) {
		log.error(
			'There has been an error while trying to download the package from NPM:'
		);
		log.error( error );
		return false;
	}
};

module.exports = {
	getBlockTemplate,
	getDefaultValues,
	getOutputFiles,
	getPrompts,
	hasWPScriptsEnabled,
	isPredefinedTemplate,
	isExternalTemplate,
	tempFolder,
};
