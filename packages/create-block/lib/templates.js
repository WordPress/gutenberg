/**
 * Internal dependencies
 */
const CLIError = require( './cli-error' );
const prompts = require( './prompts' );
const { command } = require( 'execa' );
const { existsSync  } = require( 'fs' );
const { join } = require( 'path' );
const { readFile } = require( 'fs' ).promises;
const makeDir = require( 'make-dir' );

const log = require( './log' );

const namespace = 'create-block';
const dashicon = 'smiley';
const category = 'widgets';
const author = 'The WordPress Contributors';
const license = 'GPL-2.0-or-later';
const licenseURI = 'https://www.gnu.org/licenses/gpl-2.0.html';
const version = '0.1.0';

const templates = {
	es5: {
		defaultValues: {
			namespace,
			slug: 'es5-example',
			title: 'ES5 Example',
			description:
				'Example block written with ES5 standard and no JSX – no build step required.',
			dashicon,
			category,
			author,
			license,
			licenseURI,
			version,
		},
		outputFiles: [
			'.editorconfig',
			'editor.css',
			'index.js',
			'$slug.php',
			'style.css',
			'readme.txt',
		],
	},
	esnext: {
		defaultValues: {
			namespace,
			slug: 'esnext-example',
			title: 'ESNext Example',
			description:
				'Example block written with ESNext standard and JSX support – build step required.',
			dashicon,
			category,
			author,
			license,
			licenseURI,
			version,
		},
		outputFiles: [
			'.editorconfig',
			'.gitignore',
			'editor.css',
			'src/edit.js',
			'src/index.js',
			'src/save.js',
			'$slug.php',
			'style.css',
			'readme.txt',
		],
		wpScriptsEnabled: true,
	},
};

const getTemplate = async ( templateName ) => {

	const isCoreTemplate = await checkIsCoreTemplate( templateName );
	if ( isCoreTemplate ) {
		return templates[ templateName ];
	}

	// throw a CLIError if the the template is neither a core one nor an external one
	if ( ! await checkIsExternalTemplate( templateName ) && ! isCoreTemplate ) {
		throw new CLIError(
			`Invalid template type name. Either use one of the Core templates: ${ Object.keys(
				templates
			).join( ', ' ) }. \n \n or a valid npm package name.`
		);
	}

	await downloadExternalTemplate( templateName );

	const rawPackageInfo = await readFile( join( process.cwd(), 'temp', 'node_modules', templateName, 'template.json' ) );
	const packageInfo = JSON.parse( rawPackageInfo );
	return packageInfo;

};

const getDefaultValues = async ( templateName ) => {
	const template = await getTemplate( templateName );
	return template.defaultValues;
};

const getOutputFiles = async ( templateName ) => {
	const template = await getTemplate( templateName );
	return template.outputFiles;
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

const hasWPScriptsEnabled = ( templateName ) => {
	return getTemplate( templateName ).wpScriptsEnabled || false;
};

const checkIsCoreTemplate = async templateName => templates[ templateName ] || false;

const checkIsExternalTemplate = async templateName => {
	try {
		await command( `npm view ${ templateName }` );
		return true;
	} catch ( error ) {
		return false;
	}
}

const downloadExternalTemplate = async templateName => {
	try {
		const cwd = join( process.cwd(), 'temp' );

		if ( existsSync( join( cwd, 'node_modules', templateName ) ) ) {
			return true;
		};

		// mkdir temp
		await makeDir( cwd );

		// npm init
		await command( 'npm init -y', {cwd} );

		// npm install my-template --save
		await command( `npm install ${templateName} --save`, {cwd} );

		return true;

	} catch ( error ) {
		log.error( 'There has been an error while trying to download the package from NPM:' );
		log.error( error );
		return false;
	}
}

module.exports = {
	getDefaultValues,
	getOutputFiles,
	getPrompts,
	hasWPScriptsEnabled,
	checkIsCoreTemplate,
	checkIsExternalTemplate,
};
