/**
 * Internal dependencies
 */
const CliError = require( './cli-error' );
const prompts = require( './prompts' );

const namespace = 'create-block';
const dashicon = 'smiley';
const category = 'widgets';
const author = 'The WordPress Contributors';
const license = 'GPL-2.0-or-later';
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
			version,
		},
		outputFiles: [
			'.editorconfig',
			'editor.css',
			'index.js',
			'$slug.php',
			'style.css',
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
			version,
		},
		outputFiles: [
			'.editorconfig',
			'.gitignore',
			'editor.css',
			'src/index.js',
			'$slug.php',
			'style.css',
		],
		wpScriptsEnabled: true,
	},
};

const getTemplate = ( templateName ) => {
	if ( ! templates[ templateName ] ) {
		throw new CliError(
			`Invalid template type name. Allowed values: ${ Object.keys(
				templates
			).join( ', ' ) }.`
		);
	}
	return templates[ templateName ];
};

const getDefaultValues = ( templateName ) => {
	return getTemplate( templateName ).defaultValues;
};

const getOutputFiles = ( templateName ) => {
	return getTemplate( templateName ).outputFiles;
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
	return getTemplate( templateName ).wpScriptsEnabled || false;
};

module.exports = {
	getDefaultValues,
	getOutputFiles,
	getPrompts,
	hasWPScriptsEnabled,
};
