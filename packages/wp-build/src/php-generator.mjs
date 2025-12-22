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
 * @param {string} rootDir           Root directory path.
 * @param {string} baseUrlExpression PHP expression for base URL (e.g. "includes_url( 'build' )").
 * @return {Promise<Record<string, string>>} Replacements object with {{PREFIX}}, {{VERSION}}, {{VERSION_CONSTANT}}, {{BASE_URL}}.
 */
export async function getPhpReplacements(
	rootDir,
	baseUrlExpression = "plugins_url( 'build', dirname( __FILE__ ) )"
) {
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
		'{{BASE_URL}}': baseUrlExpression,
	};
}

/**
 * Apply template replacements to a template string.
 *
 * @param {string}                 template     Template string with placeholders.
 * @param {Record<string, string>} replacements Replacements object (e.g. {'{{PREFIX}}': 'gutenberg'}).
 * @return {string} Template with replacements applied.
 */
export function applyTemplateReplacements( template, replacements ) {
	let content = template;
	for ( const [ placeholder, value ] of Object.entries( replacements ) ) {
		content = content.replaceAll( placeholder, value );
	}
	return content;
}

/**
 * Render a template to a string with replacements.
 *
 * @param {string}                 templateName Template file name.
 * @param {Record<string, string>} replacements Replacements object (e.g. {'{{PREFIX}}': 'gutenberg'}).
 * @return {Promise<string>} Rendered template string.
 */
export async function renderTemplateToString( templateName, replacements ) {
	// Templates directory
	const templatesDir = path.join( __dirname, '..', 'templates' );

	// Read template
	const template = await readFile(
		path.join( templatesDir, templateName ),
		'utf8'
	);

	// Apply replacements
	return applyTemplateReplacements( template, replacements );
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
	// Render template to string
	const content = await renderTemplateToString( templateName, replacements );

	// Write output file
	await mkdir( path.dirname( outputPath ), { recursive: true } );
	await writeFile( outputPath, content );
}
