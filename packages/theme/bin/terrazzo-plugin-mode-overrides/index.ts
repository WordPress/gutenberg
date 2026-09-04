import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from '@terrazzo/parser';

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
	value: unknown
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
 * Terrazzo plugin that generates mode-specific DTCG override files.
 *
 * @return A Terrazzo plugin that generates mode-specific DTCG override files.
 */
export default function pluginModeOverrides(): Plugin {
	const sourceByToken = new Map< string, string >();

	return {
		name: '@wordpress/terrazzo-plugin-mode-overrides',
		enforce: 'pre',
		async transform( { tokens } ) {
			sourceByToken.clear();
			for ( const [ id, token ] of Object.entries( tokens ) ) {
				const { filename } = token.source;

				if ( filename ) {
					sourceByToken.set( id, filename );
				}
			}
		},
		async build( { outputFile, resolver } ) {
			const permutations = resolver.listPermutations?.();

			if ( ! permutations ) {
				throw new Error(
					'Could not enumerate mode permutations from the Terrazzo resolver.'
				);
			}

			const modifierNames = new Set(
				permutations.flatMap( ( input ) => Object.keys( input ) )
			);

			if ( modifierNames.size !== 1 ) {
				throw new Error(
					`Expected one mode modifier, received ${ modifierNames.size }.`
				);
			}

			const [ modeModifier ] = modifierNames;

			for ( const input of permutations ) {
				const mode = input[ modeModifier ];

				if ( ! mode || mode === '.' ) {
					continue;
				}

				const modeTokens = resolver.apply( input, {
					sets: [],
					modifiers: [ modeModifier ],
					resolveAliases: false,
				} );
				const outputs = new Map<
					string,
					{ filename: URL; document: Record< string, unknown > }
				>();

				for ( const [ id, token ] of Object.entries( modeTokens ) ) {
					const sourceFilename = sourceByToken.get( id );

					if ( ! sourceFilename ) {
						throw new Error( `Could not find source for ${ id }.` );
					}

					const sourceUrl = new URL( sourceFilename );
					const output = outputs.get( sourceUrl.href ) ?? {
						filename: sourceUrl,
						document: {},
					};

					setNestedValue( output.document, id.split( '.' ), {
						$type: token.$type,
						$value: token.$value,
					} );
					outputs.set( sourceUrl.href, output );
				}

				for ( const { filename, document } of outputs.values() ) {
					const sourceDir = new URL( './', filename );
					const outFileName = `${ basename(
						filename.pathname,
						'.json'
					) }.${ mode }.json`;
					const outFileUrl = new URL(
						`modes/${ outFileName }`,
						sourceDir
					);

					outputFile(
						fileURLToPath( outFileUrl ),
						JSON.stringify( document, null, '\t' )
					);
				}
			}
		},
	};
}
