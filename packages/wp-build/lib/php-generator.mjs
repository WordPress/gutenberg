import { readFile, readdir, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPackageInfoFromFile } from './package-utils.mjs';
import { generateContentHash } from './wordpress-externals-plugin.mjs';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );

/**
 * Generate a content hash of the built assets, skipping the generated PHP files.
 *
 * @param {string} buildDir Build directory path.
 * @return {Promise<string>} Content hash string.
 */
async function generateBuildHash( buildDir ) {
	await mkdir( buildDir, { recursive: true } );
	const files = (
		await readdir( buildDir, { recursive: true, withFileTypes: true } )
	)
		.filter( ( file ) => file.isFile() && ! file.name.endsWith( '.php' ) )
		.map( ( file ) => path.join( file.parentPath, file.name ) );

	return generateContentHash( files );
}

/**
 * Get PHP replacements from root package.json.
 *
 * @param {string} rootDir           Root directory path.
 * @param {string} baseUrlExpression PHP expression for base URL (e.g. "includes_url( 'build' )").
 * @return {Promise<Record<string, string>>} Replacements object with {{PREFIX}}, {{VERSION}}, {{BASE_URL}}.
 */
export async function getPhpReplacements( rootDir, baseUrlExpression ) {
	const rootPackageJson = getPackageInfoFromFile(
		path.join( rootDir, 'package.json' )
	);
	if ( ! rootPackageJson ) {
		throw new Error( 'Could not read root package.json' );
	}

	// @ts-expect-error specific override to package.json
	const name = rootPackageJson.wpPlugin?.name || 'gutenberg';
	const version =
		rootPackageJson.version ||
		( await generateBuildHash( path.join( rootDir, 'build' ) ) );

	return {
		'{{PREFIX}}': name,
		'{{VERSION}}': version,
		'{{BASE_URL}}': baseUrlExpression,
	};
}

/**
 * Apply template replacements to a template string.
 *
 * In the Gutenberg repository, the PHP templates are statically analyzed with
 * a sample value for each placeholder, in `tools/phpstan/src/WpBuildTemplateParser.php`.
 * When a placeholder is added, or what one expands to changes shape, update
 * its sample value there too.
 *
 * @param {string}                 template     Template string with placeholders.
 * @param {Record<string, string>} replacements Replacements object (e.g. {'{{PREFIX}}': 'gutenberg'}).
 * @return {string} Template with replacements applied.
 */
export function applyTemplateReplacements( template, replacements ) {
	let content = template;
	for ( const [ placeholder, value ] of Object.entries( replacements ) ) {
		content = content.split( placeholder ).join( value );
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
