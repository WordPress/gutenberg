import { tokens, groups } from '../../prebuilt/js/design-tokens.mjs';

export type TokenEntry = {
	/** CSS custom property, e.g. `--wpds-color-background-surface-neutral`. */
	name: string;
	description: string;
	/** Resolved default value as a CSS string, when it has a stable one. */
	css?: string;
};

export type TokenGroup = {
	/** Path segments below the token group, e.g. `[ 'background', 'surface' ]`. */
	path: string[];
	tokens: TokenEntry[];
};

/**
 * Splits the token export's flat list for one group (e.g. `color`) into
 * sub-groups, keyed by the segments of the name between the group prefix and
 * the variable tail (the part that varies within a sub-group).
 *
 * @param group   Group name from the `groups` export.
 * @param getPath Derives the sub-group path from the name segments that follow
 *                `--wpds-<group>-`.
 */
function collect(
	group: string,
	getPath: ( segments: string[] ) => string[]
): TokenGroup[] {
	const result: TokenGroup[] = [];
	const prefix = `--wpds-${ group }-`;

	for ( const name of ( groups as Record< string, readonly string[] > )[
		group
	] ) {
		const path = getPath( name.slice( prefix.length ).split( '-' ) );
		const key = path.join( '/' );
		let entry = result.find( ( item ) => item.path.join( '/' ) === key );
		if ( ! entry ) {
			entry = { path, tokens: [] };
			result.push( entry );
		}
		const token = tokens[ name as keyof typeof tokens ];
		entry.tokens.push( {
			name,
			description: token.$description,
			css: 'modes' in token ? token.modes.default.css : undefined,
		} );
	}

	return result;
}

// Color names are `<property>-<target>-<tone…>`; `stroke-focus` has no target.
export const colorGroups = collect( 'color', ( segments ) =>
	segments.length > 2 ? segments.slice( 0, 2 ) : segments.slice( 0, 1 )
);

// Border and dimension names end with a single scale step (`md`, `2xl`).
const dropScaleStep = ( segments: string[] ) => segments.slice( 0, -1 );

export const borderGroups = collect( 'border', dropScaleStep );

export const dimensionGroups = collect( 'dimension', dropScaleStep );

/**
 * Turns a path such as `[ 'background', 'surface' ]` into a title.
 *
 * @param segments Path segments.
 */
export function pathTitle( segments: string[] ): string {
	const text = segments.join( ' › ' ).replace( /-/g, ' ' );
	return text.charAt( 0 ).toUpperCase() + text.slice( 1 );
}
