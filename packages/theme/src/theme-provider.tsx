import { useMemo, useRef } from '@wordpress/element';
import { useIsomorphicLayoutEffect } from '@wordpress/compose';
import { ThemeContext } from './context';
import { useThemeProviderStyles } from './use-theme-provider-styles';
import { type ThemeProviderProps } from './types';
import styles from './style.module.css';

// Dev-only: count active root providers per document so we can warn when more
// than one is mounted on the same document (their forwarded `html` styles
// would conflict). Keyed weakly so iframe documents don't leak.
const rootProviderCountByDocument = new WeakMap< Document, number >();

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

	const wrapperRef = useRef< HTMLDivElement >( null );

	// For root providers, mirror the wrapper's custom properties onto the
	// document element of the wrapper's own document (which may be an iframe)
	// so they reach portals and content rendered outside the React subtree.
	// `html` is shared, so set/remove individual properties (restoring any
	// prior value) rather than assigning a whole style object. Preset settings
	// like `cornerRadius` are forwarded by the prebuilt CSS instead.
	useIsomorphicLayoutEffect( () => {
		if ( ! isRoot ) {
			return;
		}
		const doc = wrapperRef.current?.ownerDocument;
		if ( ! doc ) {
			return;
		}
		const root = doc.documentElement;

		if ( process.env.NODE_ENV !== 'production' ) {
			const active = rootProviderCountByDocument.get( doc ) ?? 0;
			if ( active > 0 ) {
				// eslint-disable-next-line no-console
				console.warn(
					'ThemeProvider: More than one root provider (`isRoot`) is mounted on the same document. Their forwarded document-level styles conflict, and unmounting one can reset the others. Render a single root provider per document.'
				);
			}
			rootProviderCountByDocument.set( doc, active + 1 );
		}

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
			if ( process.env.NODE_ENV !== 'production' ) {
				const active = rootProviderCountByDocument.get( doc ) ?? 1;
				if ( active <= 1 ) {
					rootProviderCountByDocument.delete( doc );
				} else {
					rootProviderCountByDocument.set( doc, active - 1 );
				}
			}

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
			ref={ wrapperRef }
			data-wpds-root-provider={ isRoot || undefined }
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
