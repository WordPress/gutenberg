/**
 * Internal dependencies
 */
import type { GlobalStylesConfig } from './types';

/**
 * Temporary aliases for persisted style state keys shipped before breakpoint
 * states used the `@` prefix and custom states used the `-` prefix.
 *
 * Gutenberg plugin back compat for data saved before state keys were prefixed.
 * Guarded by `IS_GUTENBERG_PLUGIN` so synced Core package code does not apply it.
 */
const LEGACY_STYLE_STATE_ALIASES: Record< string, string > = {
	'@mobile': 'mobile',
	'@tablet': 'tablet',
	'-current': '@current',
};

/* eslint-disable @wordpress/wp-global-usage */
declare global {
	var IS_GUTENBERG_PLUGIN: boolean | undefined;
}
/* eslint-enable @wordpress/wp-global-usage */

/**
 * Returns whether a value is a non-array object.
 *
 * @param value Value to check.
 * @return Whether the value is a non-array object.
 */
function isObjectRecord( value: unknown ): value is Record< string, any > {
	return !! value && typeof value === 'object' && ! Array.isArray( value );
}

/**
 * Normalizes legacy persisted style state aliases within a style node.
 *
 * For example, `{ mobile: { color: ... } }` becomes
 * `{ '@mobile': { color: ... } }`, and `{ '@current': { color: ... } }`
 * becomes `{ '-current': { color: ... } }`.
 *
 * @param node Style node or nested value.
 * @return Normalized style node or original value.
 */
function normalizeStyleStateNode( node: any ): any {
	if ( ! isObjectRecord( node ) ) {
		return node;
	}

	let normalized = node;

	// Normalize legacy keys at the current style node before walking children.
	Object.entries( LEGACY_STYLE_STATE_ALIASES ).forEach(
		( [ state, legacyState ] ) => {
			if ( Object.hasOwn( node, legacyState ) ) {
				// Clone lazily before mutating this node.
				if ( normalized === node ) {
					normalized = { ...node };
				}
				if ( ! Object.hasOwn( node, state ) ) {
					normalized[ state ] = node[ legacyState ];
				}
				delete normalized[ legacyState ];
			}
		}
	);

	// Recurse into nested style nodes, such as blocks, elements, and variations.
	Object.entries( normalized ).forEach( ( [ key, value ] ) => {
		if ( ! isObjectRecord( value ) ) {
			return;
		}

		const normalizedValue = normalizeStyleStateNode( value );
		if ( normalizedValue !== value ) {
			// Clone lazily before mutating this node.
			if ( normalized === node ) {
				normalized = { ...node };
			}
			normalized[ key ] = normalizedValue;
		}
	} );

	return normalized;
}

/**
 * Normalizes legacy persisted style state aliases in a global styles config.
 *
 * For example, `styles.blocks['core/button'].mobile` becomes
 * `styles.blocks['core/button']['@mobile']`.
 *
 * @param globalStyles Global styles config to normalize.
 * @return Global styles config with canonical style state keys.
 */
export function normalizeStyleStateAliases(
	globalStyles: GlobalStylesConfig
): GlobalStylesConfig {
	if ( ! globalThis.IS_GUTENBERG_PLUGIN ) {
		return globalStyles;
	}

	if ( ! globalStyles?.styles ) {
		return globalStyles;
	}

	const styles = normalizeStyleStateNode( globalStyles.styles );
	return styles === globalStyles.styles
		? globalStyles
		: { ...globalStyles, styles };
}

/**
 * Returns the legacy equivalent of a canonical style state path.
 *
 * For example, `styles.blocks.core/button.@mobile.color.text` maps to
 * `styles.blocks.core/button.mobile.color.text`.
 *
 * @param path Canonical dot-separated object path.
 * @return Legacy path when one differs, otherwise undefined.
 */
export function getLegacyStyleStatePath( path: string ): string | undefined {
	if ( ! globalThis.IS_GUTENBERG_PLUGIN ) {
		return undefined;
	}

	const pathParts = path.split( '.' );
	const legacyPathParts = pathParts.map(
		( part ) => LEGACY_STYLE_STATE_ALIASES[ part ] ?? part
	);

	return legacyPathParts.some(
		( part, index ) => part !== pathParts[ index ]
	)
		? legacyPathParts.join( '.' )
		: undefined;
}
