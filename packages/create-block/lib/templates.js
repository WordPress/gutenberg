/**
 * External dependencies
 */
const glob = require( 'fast-glob' );
const { join } = require( 'path' );

/**
 * Internal dependencies
 */
const CLIError = require( './cli-error' );
const prompts = require( './prompts' );

const templates = {
	es5: {
		defaultValues: {
			slug: 'es5-example',
			title: 'ES5 Example',
			description:
				'Example block written with ES5 standard and no JSX – no build step required.',
		},
		templatesPath: './templates/es5',
		wpScripts: false,
	},
	esnext: {
		defaultValues: {
			slug: 'esnext-example',
			title: 'ESNext Example',
			description:
				'Example block written with ESNext standard and JSX support – build step required.',
		},
		templatesPath: './templates/esnext',
	},
};

const getTemplate = ( templateName ) => {
	if ( ! templates[ templateName ] ) {
		throw new CLIError(
			`Invalid template type name. Allowed values: ${ Object.keys(
				templates
			).join( ', ' ) }.`
		);
	}
	return templates[ templateName ];
};

const getDefaultValues = ( templateName ) => {
	return {
		namespace: 'create-block',
		dashicon: 'smiley',
		category: 'widgets',
		author: 'The WordPress Contributors',
		license: 'GPL-2.0-or-later',
		licenseURI: 'https://www.gnu.org/licenses/gpl-2.0.html',
		version: '0.1.0',
		...getTemplate( templateName ).defaultValues,
	};
};

const getOutputFiles = async ( templateName ) => {
	const templatesPath = getTemplate( templateName ).templatesPath;

	return await glob( '**/*.mustache', {
		cwd: join( __dirname, templatesPath ),
		dot: true,
	} );
};

const getPrompts = ( templateName ) => {
	const defaultValues = getDefaultValues( templateName );
	return Object.keys( prompts ).map( ( promptName ) => {
		return {
			...prompts[ promptName ],
			default: defaultValues[ promptName ],
		};
	} );
};

const hasWPScriptsEnabled = ( templateName ) => {
	return ! ( getTemplate( templateName ).wpScripts === false );
};

module.exports = {
	getDefaultValues,
	getOutputFiles,
	getPrompts,
	hasWPScriptsEnabled,
};
