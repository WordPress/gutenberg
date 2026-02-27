/**
 * External dependencies
 */
import type { CSSProperties } from 'react';

/**
 * WordPress dependencies
 */
import { useMemo, useId } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ThemeContext } from './context';
import { useThemeProviderStyles } from './use-theme-provider-styles';
import { type ThemeProviderProps } from './types';
import styles from './style.module.css';

function cssObjectToText( values: CSSProperties ) {
	return Object.entries( values )
		.map( ( [ key, value ] ) => `${ key }: ${ value };` )
		.join( '' );
}

function generateCSSSelector( {
	instanceId,
	isRoot,
}: {
	instanceId: string;
	isRoot: boolean;
} ) {
	const rootSel = `[data-wpds-root-provider="true"]`;
	const instanceIdSel = `[data-wpds-theme-provider-id="${ instanceId }"]`;

	const selectors = [];

	if ( isRoot ) {
		selectors.push(
			`:root:has(.${ styles.root }${ rootSel }${ instanceIdSel })`
		);
	}

	selectors.push( `.${ styles.root }.${ styles.root }${ instanceIdSel }` );

	return selectors.join( ',' );
}

export const ThemeProvider = ( {
	children,
	color = {},
	isRoot = false,
	density,
}: ThemeProviderProps ) => {
	const instanceId = useId();

	const { themeProviderStyles, resolvedSettings } = useThemeProviderStyles( {
		color,
	} );

	const contextValue = useMemo(
		() => ( {
			resolvedSettings,
		} ),
		[ resolvedSettings ]
	);

	return (
		<>
			{ themeProviderStyles ? (
				<style>
					{ `${ generateCSSSelector( {
						instanceId,
						isRoot,
					} ) } {${ cssObjectToText( themeProviderStyles ) }}` }
				</style>
			) : null }
			<div
				data-wpds-theme-provider-id={ instanceId }
				data-wpds-root-provider={ isRoot }
				data-wpds-density={ density }
				className={ styles.root }
			>
				<ThemeContext.Provider value={ contextValue }>
					{ children }
				</ThemeContext.Provider>
			</div>
		</>
	);
};
