/**
 * A declarative description of how variant props map to (semantic) class names.
 *
 * This is the single source of truth for a component's variant matrix. It is
 * intentionally JSON-serializable so the exact same file can be consumed by the
 * React component (to look up CSS module class names) and by the PHP renderer
 * (to compose the same hashed class names for server-side output).
 */
export type Recipe = {
	/** For each variant dimension, a map of value → semantic class name keys. */
	variants: Record< string, Record< string, string[] > >;
	/** The value to use for a dimension when a prop is not provided. */
	defaultVariants?: Record< string, string >;
};

/**
 * Resolves a recipe's variant matrix to a flat list of semantic class name keys.
 *
 * Kept deliberately small and dependency-free so it can be mirrored exactly in
 * other languages (see `_wp_ui_resolve_recipe()` in the PHP renderer).
 *
 * @param recipe The recipe describing the variant matrix.
 * @param props  The selected value for each dimension. Missing values fall back
 *               to `defaultVariants`.
 * @return The semantic class name keys for the selected variants.
 */
export function resolveRecipeClasses(
	recipe: Recipe,
	props: Record< string, string | undefined >
): string[] {
	const classes: string[] = [];

	for ( const dimension of Object.keys( recipe.variants ) ) {
		const value =
			props[ dimension ] ?? recipe.defaultVariants?.[ dimension ];
		if ( value === undefined ) {
			continue;
		}

		const mapped = recipe.variants[ dimension ][ value ];
		if ( mapped ) {
			classes.push( ...mapped );
		}
	}

	return classes;
}
