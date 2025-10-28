/**
 * External dependencies
 */
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );

/**
 * Get PHP replacements from root package.json.
 *
 * @param {string} rootDir Root directory path.
 * @return {Promise<Object>} Replacements object with {{PREFIX}}, {{VERSION}}, {{VERSION_CONSTANT}}.
 */
export async function getPhpReplacements( rootDir ) {
	const rootPackageJson = JSON.parse(
		await readFile( path.join( rootDir, 'package.json' ), 'utf8' )
	);
	const prefix = rootPackageJson.wpPlugin?.prefix || 'gutenberg';
	const version = rootPackageJson.version;
	const versionConstant =
		prefix.toUpperCase().replace( /-/g, '_' ) + '_VERSION';

	return {
		'{{PREFIX}}': prefix,
		'{{VERSION}}': version,
		'{{VERSION_CONSTANT}}': versionConstant,
	};
}

/**
 * Generate a PHP file from a template with replacements.
 *
 * @param {string} templateName Template file name.
 * @param {string} outputPath   Full output path.
 * @param {Object} replacements Replacements object (e.g. {'{{PREFIX}}': 'gutenberg'}).
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
		// Use regex to replace all occurrences (like /{{PREFIX}}/g)
		const regex = new RegExp( placeholder.replace( /[{}]/g, '\\$&' ), 'g' );
		content = content.replace( regex, value );
	}

	// Write output file
	await mkdir( path.dirname( outputPath ), { recursive: true } );
	await writeFile( outputPath, content, 'utf8' );
}
