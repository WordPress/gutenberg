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

	// For root providers, mirror the wrapper's custom properties onto `html`
	// so they reach portals and content outside the React app. `html` is
	// shared, so set/remove individual properties (restoring any prior value)
	// rather than assigning a whole style object. (Preset settings like
	// `cornerRadius` are forwarded by the prebuilt CSS instead.)
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
