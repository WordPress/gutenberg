/**
 * Generates the PHP copy of the view-config REST schema from the canonical
 * JSON Schema.
 *
 * Reads from  : schemas/json/view-config.json
 * Publishes to: lib/compat/wordpress-7.1/view-config-schema.php
 *
 * The generated file returns the schema as a PHP array with all local `$ref`
 * pointers dereferenced, the `definitions` map dropped, and `description`
 * annotations wrapped in `__()` calls so they are picked up by the plugin's
 * translation pipeline.
 *
 * Usage:
 *   node tools/docs/gen-view-config-schema-php.mjs          # (re)generate
 *   node tools/docs/gen-view-config-schema-php.mjs --check  # fail if stale
 *
 * This script is dependency-free on purpose so the `--check` mode can run
 * in any environment (e.g. as part of the integration test suite).
 */

/**
 * External dependencies
 */
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Path to the canonical view-config JSON Schema.
 *
 * @type {string}
 */
const VIEW_CONFIG_SCHEMA_PATH = fileURLToPath(
	new URL( '../../schemas/json/view-config.json', import.meta.url )
);

/**
 * Path to the generated PHP schema file.
 *
 * @type {string}
 */
const PHP_SCHEMA_PATH = fileURLToPath(
	new URL(
		'../../lib/compat/wordpress-7.1/view-config-schema.php',
		import.meta.url
	)
);

/**
 * Resolves local `$ref` pointers (e.g. `#/definitions/foo` or
 * `#/definitions/foo/properties/bar`) against the schema root.
 *
 * @param {*}      node Schema node to resolve.
 * @param {Object} root Schema root the pointers are resolved against.
 * @return {*} The resolved node.
 */
function resolveRefs( node, root ) {
	if ( Array.isArray( node ) ) {
		return node.map( ( item ) => resolveRefs( item, root ) );
	}
	if ( ! node || typeof node !== 'object' ) {
		return node;
	}
	if ( typeof node.$ref === 'string' && node.$ref.startsWith( '#/' ) ) {
		let target = root;
		for ( const rawSegment of node.$ref.slice( 2 ).split( '/' ) ) {
			const segment = rawSegment
				.replaceAll( '~1', '/' )
				.replaceAll( '~0', '~' );
			if ( ! target || ! ( segment in target ) ) {
				throw new Error( `Unresolvable $ref \`${ node.$ref }\`.` );
			}
			target = target[ segment ];
		}
		return resolveRefs( target, root );
	}
	return Object.fromEntries(
		Object.entries( node ).map( ( [ key, value ] ) => [
			key,
			resolveRefs( value, root ),
		] )
	);
}

/**
 * Serializes a value as a PHP literal.
 *
 * `description` annotations are emitted as translatable strings, i.e.
 * `__( '…', 'gutenberg' )`. Only string values qualify: a schema *property*
 * named `description` (e.g. a form field description) maps to an object, so
 * it is serialized as a regular array.
 *
 * @param {*}      value  Value to serialize.
 * @param {string} indent Current indentation.
 * @return {string} PHP literal.
 */
function toPhp( value, indent = '' ) {
	if ( value === null ) {
		return 'null';
	}
	if ( typeof value === 'boolean' || typeof value === 'number' ) {
		return JSON.stringify( value );
	}
	if ( typeof value === 'string' ) {
		return `'${ value
			.replaceAll( '\\', '\\\\' )
			.replaceAll( "'", "\\'" ) }'`;
	}
	const inner = indent + '\t';
	if ( Array.isArray( value ) ) {
		if ( value.length === 0 ) {
			return 'array()';
		}
		const items = value
			.map( ( item ) => `${ inner }${ toPhp( item, inner ) },\n` )
			.join( '' );
		return `array(\n${ items }${ indent })`;
	}
	const entries = Object.entries( value );
	if ( entries.length === 0 ) {
		return 'array()';
	}
	const items = entries
		.map( ( [ key, item ] ) => {
			const serialized =
				key === 'description' && typeof item === 'string'
					? `__( ${ toPhp( item ) }, 'gutenberg' )`
					: toPhp( item, inner );
			return `${ inner }${ toPhp( key ) } => ${ serialized },\n`;
		} )
		.join( '' );
	return `array(\n${ items }${ indent })`;
}

/**
 * Generates the content of the PHP schema file.
 *
 * @return {string} PHP source.
 */
export function generate() {
	const schema = JSON.parse(
		fs.readFileSync( VIEW_CONFIG_SCHEMA_PATH, 'utf8' )
	);
	const dereferenced = resolveRefs( schema, schema );
	delete dereferenced.definitions;

	return `<?php
/**
 * The REST schema of the \`/wp/v2/view-config\` endpoint.
 *
 * GENERATED FILE — DO NOT EDIT. Regenerate from the canonical JSON Schema
 * at schemas/json/view-config.json with:
 *
 *     node tools/docs/gen-view-config-schema-php.mjs
 *
 * @package gutenberg
 */

// phpcs:ignoreFile

return ${ toPhp( dereferenced ) };
`;
}

const isMain =
	process.argv[ 1 ] &&
	import.meta.url === new URL( `file://${ process.argv[ 1 ] }` ).href;

if ( isMain ) {
	const content = generate();
	if ( process.argv.includes( '--check' ) ) {
		const current = fs.existsSync( PHP_SCHEMA_PATH )
			? fs.readFileSync( PHP_SCHEMA_PATH, 'utf8' )
			: null;
		if ( current !== content ) {
			console.error(
				'lib/compat/wordpress-7.1/view-config-schema.php is out of date with ' +
					'schemas/json/view-config.json. Regenerate it with ' +
					'`node tools/docs/gen-view-config-schema-php.mjs`.'
			);
			process.exit( 1 );
		}
	} else {
		fs.writeFileSync( PHP_SCHEMA_PATH, content );
		console.log( `Generated ${ PHP_SCHEMA_PATH }.` );
	}
}
