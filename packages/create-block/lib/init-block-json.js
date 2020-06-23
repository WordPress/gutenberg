/**
 * External dependencies
 */
const { isEmpty, omitBy } = require( 'lodash' );
const { join } = require( 'path' );
const { writeFile } = require( 'fs' ).promises;

/**
 * Internal dependencies
 */
const { info } = require( './log' );

module.exports = async (
	blockTemplate,
	{ slug, namespace, title, description, category, dashicon, textdomain }
) => {
	const outputFile = join( process.cwd(), slug, 'block.json' );
	const template = blockTemplate.defaultValues.slug.split( '-' ).shift();
	const editorScript = 'esnext' === template ? 'build/index.js' : 'index.js';
	const editorStyle =
		'esnext' === template ? 'build/index.css' : 'editor.css';

	info( '' );
	info( 'Creating a "block.json" file.' );
	await writeFile(
		outputFile,
		JSON.stringify(
			omitBy(
				{
					name: namespace + '/' + slug,
					title,
					category,
					icon: dashicon,
					description,
					textdomain,
					supports: {
						html: false,
					},
					editorScript,
					editorStyle,
				},
				isEmpty
			),
			null,
			'\t'
		)
	);
};
