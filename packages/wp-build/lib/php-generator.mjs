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
	const version = rootPackageJson.version;

	return {
		'{{PREFIX}}': name,
		'{{VERSION}}': version,
		'{{BASE_URL}}': baseUrlExpression,
	};
}

/**
 * Whether the current build targets WordPress Core.
 * When true, `if ( ! function_exists() )` pluggable guards are omitted from
 * generated PHP files. Both conditions must be met:
 * - npm_package_config_IS_WORDPRESS_CORE must be truthy
 * - wpPlugin.name in root package.json must equal 'wp'
 *
 * @param {Record<string, string>} replacements Replacements object from getPhpReplacements().
 * @return {boolean} Whether this is a WordPress Core build.
 */
function isWordPressCoreBuild( replacements ) {
	return (
		Boolean( process.env.npm_package_config_IS_WORDPRESS_CORE ) &&
		replacements[ '{{PREFIX}}' ] === 'wp'
	);
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
 * Performs two passes:
 * 1. Static placeholder replacements ({{PREFIX}}, {{VERSION}}, {{BASE_URL}}, etc.)
 * 2. Pluggable guard resolution — {{IF_PLUGGABLE:fname}} / {{END_IF_PLUGGABLE}} markers
 *    are expanded to `if ( ! function_exists( 'fname' ) ) {` / `}` for plugin builds,
 *    or removed entirely for WordPress Core builds.
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

	// First pass: apply static replacements
	let content = applyTemplateReplacements( template, replacements );

	// Second pass: resolve pluggable guard markers.
	// Matches the entire block from {{IF_PLUGGABLE:fname}} to {{END_IF_PLUGGABLE}}
	// so the block body can be indented (plugin builds) or left as-is (Core builds).
	const pluggableBlockRegex =
		/\{\{IF_PLUGGABLE:([^}]+)\}\}\n([\s\S]*?)\n\{\{END_IF_PLUGGABLE\}\}/g;

	if ( isWordPressCoreBuild( replacements ) ) {
		// Remove the guard wrappers entirely — functions are defined unconditionally
		content = content.replace(
			pluggableBlockRegex,
			( _match, _fnName, body ) => body
		);
	} else {
		// Wrap block body in `if ( ! function_exists() )` and indent it by one tab
		content = content.replace(
			pluggableBlockRegex,
			( _match, fnName, body ) => {
				const indented = body
					.split( '\n' )
					.map(
					/** @param {string} line */
					( line ) => ( line.length ? `\t${ line }` : line )
				)
					.join( '\n' );
				return `if ( ! function_exists( '${ fnName }' ) ) {\n${ indented }\n}`;
			}
		);
	}

	return content;
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
