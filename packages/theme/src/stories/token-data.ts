import colorTokens from '../../tokens/color.json';
import borderTokens from '../../tokens/border.json';
import dimensionTokens from '../../tokens/dimension.json';

export type TokenEntry = {
	/** CSS custom property, e.g. `--wpds-color-background-surface-neutral`. */
	name: string;
	description: string;
};

export type TokenGroup = {
	/** Path segments below the token root, e.g. `[ 'background', 'surface' ]`. */
	path: string[];
	tokens: TokenEntry[];
};

type TokenNode = { $description?: string; [ key: string ]: unknown };

function isNode( value: unknown ): value is TokenNode {
	return typeof value === 'object' && value !== null;
}

/**
 * Flattens a token tree into groups of leaf tokens, one group per parent node.
 * Metadata keys (`$…`) are skipped, as are `skip`ped top-level branches such as
 * `primitive`, which are not public.
 *
 * @param root     Token tree root (e.g. the `wpds-color` node).
 * @param rootName Root key, used as the CSS variable prefix.
 * @param skip     Top-level keys to leave out.
 */
function collect(
	root: TokenNode,
	rootName: string,
	skip: string[] = []
): TokenGroup[] {
	const groups: TokenGroup[] = [];

	const walk = ( node: TokenNode, path: string[] ) => {
		const tokens: TokenEntry[] = [];
		for ( const [ key, child ] of Object.entries( node ) ) {
			if ( key.startsWith( '$' ) || ! isNode( child ) ) {
				continue;
			}
			if ( path.length === 0 && skip.includes( key ) ) {
				continue;
			}
			if ( '$value' in child ) {
				tokens.push( {
					name: `--${ [ rootName, ...path, key ].join( '-' ) }`,
					description: child.$description ?? '',
				} );
			} else {
				walk( child, [ ...path, key ] );
			}
		}
		if ( tokens.length ) {
			groups.push( { path, tokens } );
		}
	};

	walk( root, [] );
	return groups;
}

export const colorGroups = collect(
	colorTokens[ 'wpds-color' ] as TokenNode,
	'wpds-color',
	[ 'primitive' ]
);

export const borderGroups = collect(
	borderTokens[ 'wpds-border' ] as TokenNode,
	'wpds-border'
);

export const dimensionGroups = collect(
	dimensionTokens[ 'wpds-dimension' ] as TokenNode,
	'wpds-dimension',
	[ 'primitive' ]
);

/**
 * Turns a path such as `[ 'background', 'surface' ]` into a title.
 *
 * @param segments Path segments.
 */
export function pathTitle( segments: string[] ): string {
	const text = segments.join( ' › ' ).replace( /-/g, ' ' );
	return text.charAt( 0 ).toUpperCase() + text.slice( 1 );
}
