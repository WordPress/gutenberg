import { transform } from 'lightningcss';
import tokenFallbacks from '../prebuilt/js/design-token-fallbacks.mjs';
import { getTokenFallback } from '../postcss-plugins/ds-token-fallbacks.mjs';

/** @type {Map<string, import('lightningcss').TokenOrValue[]>} */
const parsedFallbacks = new Map();

// Raw replacements discard CSS Modules reference metadata. Parse the generated
// fallbacks once so the visitor can combine them with each original reference.
transform( {
	filename: 'design-token-fallbacks.css',
	code: Buffer.from(
		`:root {\n${ Object.entries( tokenFallbacks )
			.map(
				( [ tokenName, fallback ] ) =>
					`\t${ tokenName }: var(${ tokenName }, ${ fallback });`
			)
			.join( '\n' ) }\n}`
	),
	visitor: {
		Variable( variable ) {
			if (
				variable.fallback &&
				Object.hasOwn( tokenFallbacks, variable.name.ident )
			) {
				// Lightning CSS returns `from: null` in visited nodes but
				// requires null specifiers to be omitted from returned nodes.
				const fallback = JSON.parse(
					JSON.stringify( variable.fallback, ( key, value ) =>
						key === 'from' && value === null ? undefined : value
					)
				);
				parsedFallbacks.set( variable.name.ident, fallback );
			}
		},
	},
} );

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

		const fallback = parsedFallbacks.get( tokenName );
		if ( ! fallback ) {
			getTokenFallback( tokenName );
			return;
		}

		return {
			type: 'var',
			value: {
				name: variable.name.from
					? variable.name
					: { ident: variable.name.ident },
				fallback,
			},
		};
	},
};

export default plugin;
