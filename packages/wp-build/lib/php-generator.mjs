/**
 * External dependencies
 */
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Internal dependencies
 */
import { boolConfigVal, getPackageInfoFromFile } from './package-utils.mjs';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );

/**
 * Get PHP replacements from root package.json.
 *
 * @param {string} rootDir           Root directory path.
 * @param {string} baseUrlExpression PHP expression for base URL (e.g. "includes_url( 'build' )").
 * @return {Promise<Record<string, string>>} Replacements object with {{PREFIX}}, {{VERSION}}, {{BASE_URL}}, {{SINCE_TAG}}.
 */
export async function getPhpReplacements( rootDir, baseUrlExpression ) {
	const isCoreBuild =
		boolConfigVal( process.env.IS_WORDPRESS_CORE ) ??
		boolConfigVal( process.env.npm_package_config_IS_WORDPRESS_CORE ) ??
		false;
	const rootPackageJson = getPackageInfoFromFile(
		path.join( rootDir, 'package.json' )
	);
	if ( ! rootPackageJson ) {
		throw new Error( 'Could not read root package.json' );
	}

	// @ts-expect-error specific override to package.json
	const name = rootPackageJson.wpPlugin?.name || 'gutenberg';
	const version = rootPackageJson.version;

	return {
		'{{PREFIX}}': name,
		'{{VERSION}}': version,
		'{{BASE_URL}}': baseUrlExpression,
		/*
		 * Inline @since annotations should be contextually accurate reflecting the correct WordPress or Gutenberg
		 * version they were originally introduced.
		 *
		 * Until a more flexible approach can be created, @since annotations are set to 7.0.0 any time code is being
		 * built for WordPress Core. Otherwise, the annotation is removed entirely.
		 *
		 */
		'{{SINCE_TAG}}': isCoreBuild ? '\n * @since 7.0.0\n *' : '',
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
