import { addFallbackToVar } from '../postcss-plugins/ds-token-fallbacks.mjs';

/**
 * Lightning CSS visitor that injects design-system token fallbacks into CSS.
 *
 * Replaces bare `var(--wpds-*)` references with `var(--wpds-*, <fallback>)`.
 *
 * Existing fallbacks are left untouched. Unknown tokens throw.
 *
 * @type {import('lightningcss').Visitor<never>}
 */
const plugin = {
	/** @param {import('lightningcss').Variable} variable */
	Variable( variable ) {
		// Leave existing fallbacks alone, including the valid empty fallback
		// form `var(--token,)` which Lightning CSS parses as `fallback: []`.
		if ( variable.fallback !== null ) {
			return;
		}

		const tokenName = variable.name.ident;
		if ( ! tokenName.startsWith( '--wpds-' ) ) {
			return;
		}

		return {
			raw: addFallbackToVar( `var(${ tokenName })` ),
		};
	},
};

export default plugin;
