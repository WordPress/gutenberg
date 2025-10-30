/**
 * External dependencies
 */
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Internal dependencies
 */
import { getPackageInfoFromFile } from './package-utils.mjs';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );

/**
 * Get PHP replacements from root package.json.
 *
 * @param {string} rootDir Root directory path.
 * @return {Promise<Record<string, string>>} Replacements object with {{PREFIX}}, {{VERSION}}, {{VERSION_CONSTANT}}.
 */
export async function getPhpReplacements( rootDir ) {
	const rootPackageJson = getPackageInfoFromFile(
		path.join( rootDir, 'package.json' )
	);
	if ( ! rootPackageJson ) {
		throw new Error( 'Could not read root package.json' );
	}

	// @ts-expect-error specific override to package.json
	const name = rootPackageJson.wpPlugin?.name || 'gutenberg';
	const version = rootPackageJson.version;
	const versionConstant =
		name.toUpperCase().replace( /-/g, '_' ) + '_VERSION';

	return {
		'{{PREFIX}}': name,
		'{{VERSION}}': version,
		'{{VERSION_CONSTANT}}': versionConstant,
	};
}

/**
 * Generate a PHP file from a template with replacements.
 *
 * @param {string}                 templateName Template file name.
 * @param {string}                 outputPath   Full output path.
 * @param {Record<string, string>} replacements Replacements object (e.g. {'{{PREFIX}}': 'gutenberg'}).
 */
export async function generatePhpFromTemplate(
	templateName,
	outputPath,
	replacements
) {
	// Templates directory
	const templatesDir = path.join( __dirname, '..', 'templates' );

	// Read template
	const template = await readFile(
		path.join( templatesDir, templateName ),
		'utf8'
	);

	// Apply all replacements
	let content = template;
	for ( const [ placeholder, value ] of Object.entries( replacements ) ) {
		content = content.replaceAll( placeholder, value );
	}

	// Write output file
	await mkdir( path.dirname( outputPath ), { recursive: true } );
	await writeFile( outputPath, content );
}
