/*
 * SCRIPT OVERVIEW
 * ===============
 *
 * - Read the icons manifest at ./src/manifest.json
 * - For each entry, read the raw SVG file it points at
 * - Write a flat JSON map of icon slug to SVG markup at ./icons.json
 *
 * The generated file is consumed by non-JavaScript environments (e.g. PHP)
 * that cannot import this package's React components. It is ignored by Git.
 */
const path = require( 'path' );
const { readFile, writeFile } = require( 'fs/promises' );

const ICON_PACKAGE_DIR = path.join( __dirname, '..' );
const MANIFEST_JSON_PATH = path.join(
	ICON_PACKAGE_DIR,
	'src',
	'manifest.json'
);
const ICONS_JSON_PATH = path.join( ICON_PACKAGE_DIR, 'icons.json' );

/**
 * Builds the JSON object mapping icon slugs to SVG markup.
 *
 * @param {Array}  manifest          Parsed manifest array.
 * @param {Object} svgContentsByPath Map of manifest `filePath` to raw SVG content.
 * @return {Object} Map of icon slug to trimmed SVG markup.
 */
function buildIconsJson( manifest, svgContentsByPath ) {
	const icons = {};
	for ( const icon of manifest ) {
		icons[ icon.slug ] = svgContentsByPath[ icon.filePath ].trim();
	}
	return icons;
}

/**
 * Generates icons.json from the manifest and the raw SVG files.
 *
 * @param {Object} options
 * @param {string} options.manifestPath Path to the manifest JSON file. Icon
 *                                      `filePath` entries resolve relative to
 *                                      its directory.
 * @param {string} options.outputPath   Path to write the generated JSON to.
 */
async function generateIconsJson( {
	manifestPath = MANIFEST_JSON_PATH,
	outputPath = ICONS_JSON_PATH,
} = {} ) {
	const manifestContent = await readFile( manifestPath, 'utf8' );
	const manifest = JSON.parse( manifestContent );

	const sourceDir = path.dirname( manifestPath );
	const svgContentsByPath = {};
	for ( const icon of manifest ) {
		svgContentsByPath[ icon.filePath ] = await readFile(
			path.join( sourceDir, icon.filePath ),
			'utf8'
		);
	}

	const icons = buildIconsJson( manifest, svgContentsByPath );

	// Trailing newlines make ESLint happy.
	await writeFile( outputPath, JSON.stringify( icons, null, '\t' ) + '\n' );
}

if ( module === require.main ) {
	generateIconsJson();
}

module.exports = {
	buildIconsJson,
	generateIconsJson,
};
