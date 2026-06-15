import { useMemo, useLayoutEffect } from '@wordpress/element';
import { ThemeContext } from './context';
import { useThemeProviderStyles } from './use-theme-provider-styles';
import { type ThemeProviderProps } from './types';
import styles from './style.module.css';

/**
 * Context provider that generates a theme from a set of seed color values and
 * configuration, producing a set of design token overrides as CSS custom
 * properties.
 */
export const ThemeProvider = ( {
	children,
	color = {},
	cursor,
	cornerRadius,
	isRoot = false,
}: ThemeProviderProps ) => {
	const { themeProviderStyles, resolvedSettings } = useThemeProviderStyles( {
		color,
		cursor,
		cornerRadius,
	} );

	const cornerRadiusPreset = resolvedSettings.cornerRadius ?? 'subtle';

	const contextValue = useMemo(
		() => ( {
			resolvedSettings,
		} ),
		[ resolvedSettings ]
	);

	// Mirror the wrapper's dynamic custom properties (color/cursor) onto
	// `document.documentElement` so they reach portals and anything else
	// rendered outside the wrapper (e.g. the `html`/`body` background, or
	// PHP-rendered admin UI alongside the React app). Preset-based settings
	// (e.g. `cornerRadius`) are forwarded declaratively by the prebuilt CSS
	// via `:root:has([data-wpds-root-provider="true"]…)`; only the per-seed
	// values that can't be expressed in a static stylesheet are synced here.
	// Unlike the wrapper, `html` is a shared element, so we set/remove
	// individual properties (preserving any prior value) instead of
	// declaratively assigning a full style object.
	useLayoutEffect( () => {
		if ( ! isRoot || typeof document === 'undefined' ) {
			return;
		}
		const root = document.documentElement;
		const previous = new Map< string, string >();
		const applied: string[] = [];

		for ( const [ rawKey, rawValue ] of Object.entries(
			themeProviderStyles
		) ) {
			if (
				! rawKey.startsWith( '--' ) ||
				rawValue === null ||
				rawValue === undefined
			) {
				continue;
			}
			previous.set( rawKey, root.style.getPropertyValue( rawKey ) );
			root.style.setProperty( rawKey, String( rawValue ) );
			applied.push( rawKey );
		}

		return () => {
			for ( const key of applied ) {
				const prev = previous.get( key );
				if ( prev ) {
					root.style.setProperty( key, prev );
				} else {
					root.style.removeProperty( key );
				}
			}
		};
	}, [ isRoot, themeProviderStyles ] );

	return (
		<div
			data-wpds-root-provider={ isRoot ? 'true' : undefined }
			data-wpds-corner-radius={ cornerRadiusPreset }
			className={ styles.root }
			style={ themeProviderStyles }
		>
			<ThemeContext.Provider value={ contextValue }>
				{ children }
			</ThemeContext.Provider>
		</div>
	);
};
