/**
 * External dependencies
 */
import { basename, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from '@terrazzo/parser';

type DTCGPrimitiveValue =
	| string
	| number
	| boolean
	| { value: number; unit: string }
	| { r: number; g: number; b: number; a?: number };

type DTCGValue = DTCGPrimitiveValue | Record< string, DTCGPrimitiveValue >;

interface DTCGExtensions {
	[ key: string ]: unknown;
	mode?: Record< string, DTCGValue >;
}

/**
 * @see https://tr.designtokens.org/format/
 */
interface DTCGToken {
	$value: DTCGValue;
	$type?: string;
	$description?: string;
	$extensions?: DTCGExtensions;
}

interface DTCGGroup {
	$type?: string;
	$description?: string;
	$extensions?: DTCGExtensions;
	[ key: string ]:
		| DTCGToken
		| DTCGGroup
		| string
		| DTCGExtensions
		| undefined;
}

type DTCGDocument = Record< string, DTCGGroup >;

interface ModeOverride {
	path: string[];
	$value: DTCGValue;
	$type?: string;
}

/**
 * Type guard to check if a value is a DTCG token (has $value).
 *
 * @param value - The value to check.
 * @return True if the value is a DTCG token.
 */
function isDTCGToken( value: DTCGToken | DTCGGroup ): value is DTCGToken {
	return '$value' in value;
}

/**
 * Set a nested value in an object from a path array.
 *
 * @param object    - The object to modify.
 * @param pathParts - The path at which to set the value.
 * @param value     - The value to set.
 */
function setNestedValue(
	object: Record< string, unknown >,
	pathParts: string[],
	value: any
): void {
	let current = object;

	for ( let i = 0; i < pathParts.length - 1; i++ ) {
		const key = pathParts[ i ];

		if ( ! ( key in current ) ) {
			current[ key ] = {};
		}

		current = current[ key ] as Record< string, unknown >;
	}

	current[ pathParts[ pathParts.length - 1 ] ] = value;
}

/**
 * Recursively extracts mode overrides from a DTCG token tree.
 *
 * @param object      - The DTCG group to extract from.
 * @param currentPath - The current path in the token tree.
 * @param currentType - The $type inherited from parent groups.
 * @return A map of mode names to their token overrides.
 */
function getModeOverrides(
	object: DTCGGroup,
	currentPath: string[] = [],
	currentType?: string
): Map< string, ModeOverride[] > {
	const modeOverrides = new Map< string, ModeOverride[] >();

	// Check if this group defines a $type that should be inherited by children
	const groupType = object.$type ?? currentType;

	for ( const [ key, value ] of Object.entries( object ) ) {
		// Skip DTCG metadata keys
		if ( key.startsWith( '$' ) ) {
			continue;
		}

		const node = value as DTCGToken | DTCGGroup;

		if ( isDTCGToken( node ) ) {
			// Extract mode-specific values from extensions
			const modes = node.$extensions?.mode;
			if ( modes ) {
				for ( const [ mode, modeValue ] of Object.entries( modes ) ) {
					modeOverrides.set( mode, [
						...( modeOverrides.get( mode ) ?? [] ),
						{
							path: [ ...currentPath, key ],
							$value: modeValue,
							$type: node.$type ?? groupType,
						},
					] );
				}
			}
		} else {
			// Recurse into nested groups, passing down the type
			const nextPath = [ ...currentPath, key ];
			const childOverrides = getModeOverrides(
				node,
				nextPath,
				groupType
			);

			// Merge child results
			for ( const [ mode, overrides ] of childOverrides ) {
				modeOverrides.set( mode, [
					...( modeOverrides.get( mode ) ?? [] ),
					...overrides,
				] );
			}
		}
	}

	return modeOverrides;
}

/**
 * Terrazzo plugin that generates mode-specific DTCG override files.
 *
 * For each mode found in tokens (via $extensions.mode), generates a separate
 * JSON file per source file containing tokens that have values for that mode.
 *
 * @return A Terrazzo plugin that generates mode-specific DTCG override files.
 */
export default function pluginModeOverrides(): Plugin {
	return {
		name: '@wordpress/terrazzo-plugin-mode-overrides',
		async build( { outputFile, sources } ) {
			for ( const { filename, src } of sources ) {
				if ( ! filename ) {
					continue;
				}

				// Parse the source JSON file
				let document: DTCGDocument;
				try {
					document = JSON.parse( src ) as DTCGDocument;
				} catch ( error ) {
					throw new Error(
						`Could not parse ${ filename }\n\n${ error }`
					);
				}

				// Extract mode overrides from this file
				const fileOverrides = getModeOverrides( document );

				// Generate a DTCG file for each mode found in this source file
				for ( const [ mode, overrides ] of fileOverrides ) {
					const output: Record< string, unknown > = {};

					for ( const override of overrides ) {
						const { path, $value, $type } = override;
						setNestedValue( output, path, { $type, $value } );
					}

					// Output as {basename}.{mode}.json (e.g., dimension.compact.json)
					const filePath = fileURLToPath( filename );
					const outFile = join(
						dirname( filePath ),
						'modes',
						`${ basename( filePath, '.json' ) }.${ mode }.json`
					);
					outputFile( outFile, JSON.stringify( output, null, '\t' ) );
				}
			}
		},
	};
}
