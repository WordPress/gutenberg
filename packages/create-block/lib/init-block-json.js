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

module.exports = async ( {
	slug,
	namespace,
	title,
	description,
	category,
	dashicon,
	textdomain,
	editorScript,
	editorStyle,
	style,
} ) => {
	const outputFile = join( process.cwd(), slug, 'block.json' );

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
					style,
				},
				isEmpty
			),
			null,
			'\t'
		)
	);
};
