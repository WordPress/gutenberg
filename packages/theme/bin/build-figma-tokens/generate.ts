import type { Resolver } from '@terrazzo/parser';

/**
 * Generate complete DTCG files for independent Figma border collections.
 *
 * @param resolver The parsed design token resolver.
 * @return One import file per collection mode.
 */
export function generateFigmaFiles( resolver: Resolver ) {
	const files: { filename: string; contents: string }[] = [];

	for ( const [ group, modifier ] of [
		[ 'radius', 'corner-radius' ],
		[ 'width', 'pixel-density' ],
	] ) {
		const contexts = resolver.source.modifiers?.[ modifier ]?.contexts;
		if ( ! contexts ) {
			throw new Error(
				`Missing Figma collection modifier: ${ modifier }`
			);
		}

		for ( const mode of Object.keys( contexts ) ) {
			const tokens = resolver.apply(
				{ [ modifier ]: mode },
				{ modifiers: [ modifier ], resolveAliases: false }
			);
			const contents: Record< string, unknown > = {};

			for ( const [ id, token ] of Object.entries( tokens ) ) {
				if ( ! id.startsWith( `wpds-border.${ group }.` ) ) {
					continue;
				}

				// Keep the original hierarchy so Figma variable names still match.
				const path = id.split( '.' );
				const name = path.pop()!;
				let parent = contents;
				for ( const segment of path ) {
					parent[ segment ] ??= {};
					parent = parent[ segment ] as Record< string, unknown >;
				}
				parent[ name ] = {
					$type: token.$type,
					$value: token.$value,
					$description: token.$description,
					$extensions: token.$extensions,
					$deprecated: token.$deprecated,
				};
			}

			files.push( {
				filename: `${ group }/${ mode }.json`,
				contents: JSON.stringify( contents, null, '\t' ) + '\n',
			} );
		}
	}

	return files;
}
