/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	contextConnect,
	useContextSystem,
	WordPressComponentProps,
} from '../../ui/context';
import { View } from '../../view';
import { ThemeContext } from '../context';
import type {
	ThemeProviderProps,
	ThemeProps as ThemeContextType, //Note to self: the shape of ThemeProps and ThemeContext is the same. If that changes, import the Context here, not the Props.
} from '../types';

function UnconnectedThemeProvider(
	props: WordPressComponentProps< ThemeProviderProps, 'div' >,
	forwardedRef: ForwardedRef< any >
) {
	const { accent, children } = useContextSystem( props, 'ThemeProvider' );

	const themeContextValue: ThemeContextType = useMemo(
		() => ( { accent } ),
		[ accent ]
	);

	return (
		<View ref={ forwardedRef }>
			<ThemeContext.Provider value={ themeContextValue }>
				{ children }
			</ThemeContext.Provider>
		</View>
	);
}

/**
 * The `ThemeProvider` component allows components (e.g. a `Popover`) rendered in a different
 * DOM node than their parent `Theme` component to maintain access to all of the current `Theme` props.
 *
 * @example
 * ```jsx
 * WIP
 * ```
 */
export const ThemeProvider = contextConnect(
	UnconnectedThemeProvider,
	'ThemeProvider'
);

export default ThemeProvider;
