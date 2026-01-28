/**
 * External dependencies
 */
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Internal dependencies
 */
import { getPackageInfoFromFile } from './package-utils.ts';
import type { PackageJson, PhpReplacements } from './types.ts';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );

/**
 * Get PHP replacements from root package.json.
 *
 * @param rootDir           Root directory path.
 * @param baseUrlExpression PHP expression for base URL (e.g. "includes_url( 'build' )").
 * @return Replacements object with {{PREFIX}}, {{VERSION}}, {{BASE_URL}}.
 */
export async function getPhpReplacements(
	rootDir: string,
	baseUrlExpression: string
): Promise< PhpReplacements > {
	const rootPackageJson = getPackageInfoFromFile(
		path.join( rootDir, 'package.json' )
	) as PackageJson | null;

	if ( ! rootPackageJson ) {
		throw new Error( 'Could not read root package.json' );
	}

	const name = rootPackageJson.wpPlugin?.name || 'gutenberg';
	const version = rootPackageJson.version;

	return {
		'{{PREFIX}}': name,
		'{{VERSION}}': version,
		'{{BASE_URL}}': baseUrlExpression,
	};
}

/**
 * Apply template replacements to a template string.
 *
 * @param template     Template string with placeholders.
 * @param replacements Replacements object (e.g. {'{{PREFIX}}': 'gutenberg'}).
 * @return Template with replacements applied.
 */
export function applyTemplateReplacements(
	template: string,
	replacements: PhpReplacements
): string {
	let content = template;
	for ( const [ placeholder, value ] of Object.entries( replacements ) ) {
		content = content.replaceAll( placeholder, value );
	}
	return content;
}

/**
 * Render a template to a string with replacements.
 *
 * @param templateName Template file name.
 * @param replacements Replacements object (e.g. {'{{PREFIX}}': 'gutenberg'}).
 * @return Rendered template string.
 */
export async function renderTemplateToString(
	templateName: string,
	replacements: PhpReplacements
): Promise< string > {
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
 * @param templateName Template file name.
 * @param outputPath   Full output path.
 * @param replacements Replacements object (e.g. {'{{PREFIX}}': 'gutenberg'}).
 */
export async function generatePhpFromTemplate(
	templateName: string,
	outputPath: string,
	replacements: PhpReplacements
): Promise< void > {
	// Render template to string
	const content = await renderTemplateToString( templateName, replacements );

	// Write output file
	await mkdir( path.dirname( outputPath ), { recursive: true } );
	await writeFile( outputPath, content );
}
