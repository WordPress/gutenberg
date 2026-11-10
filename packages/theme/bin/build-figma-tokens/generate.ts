import type { Resolver } from '@terrazzo/parser';

/**
 * Generate complete DTCG files for independent Figma collections.
 *
 * @param resolver The parsed design token resolver.
 * @return One import file per collection mode.
 */
export function generateFigmaFiles( resolver: Resolver ) {
	const files: { filename: string; contents: string }[] = [];

	for ( const [ group, modifier ] of [
		[ 'radius', 'corner-radius' ],
		[ 'width', 'pixel-density' ],
		[ 'typography', '' ],
	] ) {
		const contexts = modifier
			? resolver.source.modifiers?.[ modifier ]?.contexts
			: { typography: {} };
		if ( ! contexts ) {
			throw new Error(
				`Missing Figma collection modifier: ${ modifier }`
			);
		}

		for ( const mode of Object.keys( contexts ) ) {
			const tokens = resolver.apply(
				modifier ? { [ modifier ]: mode } : {},
				{
					modifiers: modifier ? [ modifier ] : [],
					resolveAliases: false,
				}
			);
			const contents: Record< string, unknown > = {};

			const prefix =
				group === 'typography'
					? 'wpds-typography.'
					: `wpds-border.${ group }.`;

			for ( const [ id, token ] of Object.entries( tokens ) ) {
				if ( ! id.startsWith( prefix ) ) {
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
				const exported = {
					$type: token.$type,
					$value: token.$value,
					$description: token.$description,
					$extensions: token.$extensions,
					$deprecated: token.$deprecated,
				};

				if ( group === 'typography' ) {
					// Group extensions are not inherited by the resolved tokens.
					const scopes: Record< string, string > = {
						'font-family': 'FONT_FAMILY',
						// Native JSON uses FONT_STYLE for numeric font weights.
						'font-weight': 'FONT_STYLE',
						'font-size': 'FONT_SIZE',
						'line-height': 'LINE_HEIGHT',
					};
					const scope = scopes[ path[ 1 ] ];
					if ( scope ) {
						exported.$extensions = {
							...token.$extensions,
							'com.figma.scopes': [ scope ],
						};
					}
					if ( token.$type === 'fontFamily' ) {
						// Figma needs an installed font face, not a CSS fallback stack.
						const families: Record< string, string > = {
							heading: 'SF Pro',
							body: 'SF Pro',
							mono: 'Menlo',
						};
						if ( ! families[ name ] ) {
							throw new Error(
								`Missing Figma font family mapping: ${ id }`
							);
						}
						exported.$value = families[ name ];
					} else if ( token.$type === 'fontWeight' ) {
						// Native import accepts numeric weights as Number variables.
						exported.$type = 'number';
					}
				}
				parent[ name ] = exported;
			}

			files.push( {
				filename: `${ group }/${ mode }.json`,
				contents: JSON.stringify( contents, null, '\t' ) + '\n',
			} );
		}
	}

	return files;
}
