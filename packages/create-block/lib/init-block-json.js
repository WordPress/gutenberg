/**
 * External dependencies
 */
const { omitBy } = require( 'lodash' );
const { join } = require( 'path' );
const { writeFile } = require( 'fs' ).promises;

/**
 * Internal dependencies
 */
const { info } = require( './log' );

module.exports = async ( {
	apiVersion,
	slug,
	namespace,
	title,
	version,
	description,
	category,
	attributes,
	supports,
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
					apiVersion,
					name: namespace + '/' + slug,
					version,
					title,
					category,
					icon: dashicon,
					description,
					attributes,
					supports,
					textdomain,
					editorScript,
					editorStyle,
					style,
				},
				( value ) => ! value
			),
			null,
			'\t'
		)
	);
};
