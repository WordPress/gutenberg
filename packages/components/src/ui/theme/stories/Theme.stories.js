/**
 * External dependencies
 */
import { ThemeProvider, css } from '@emotion/react';
import styled from '@emotion/styled';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { createTheme, safeTheme, useTheme } from '..';
import { useCx } from '../../../utils';
import { VStack } from '../../../v-stack';
import { Divider } from '../../../divider';

export default {
	title: 'Components (Experimental)/Theme',
};

const MyTheme = createTheme( { colors: { black: 'white', white: 'black' } } );

const ThemedText = styled.span`
	color: ${ ( props ) => safeTheme( props.theme ).colors.black };
	background-color: ${ ( props ) => safeTheme( props.theme ).colors.white };
`;

const ThemedTextWithCss = ( { children } ) => {
	const theme = useTheme();

	const style = useMemo(
		() => css`
			color: ${ theme.colors.black };
			background-color: ${ theme.colors.white };
		`,
		[ theme ]
	);

	const cx = useCx();
	const classes = cx( style );

	return <div className={ classes }>{ children }</div>;
};

export const _default = () => {
	return (
		<VStack>
			<p>
				Check out the source code for this story to see the differences
				in how these are implemented.
			</p>
			<p>
				The first group uses `styled` with the `safeTheme` function to
				access the contextual theme without requiring a root level
				ThemeProvider to provide the default theme
			</p>
			<p>
				The second group uses our custom `useTheme` hook which wraps
				Emotion&apos;s own `useTheme` with a simple conditional to
				return the default theme if none was provided by a ThemeProvider
			</p>
			<Divider />
			<ThemedText>This is text without the custom theme</ThemedText>
			<ThemeProvider theme={ MyTheme }>
				<ThemedText>This is text with the custom theme</ThemedText>
			</ThemeProvider>
			<Divider />
			<ThemedTextWithCss>
				This is text without the custom theme using `css`
			</ThemedTextWithCss>
			<ThemeProvider theme={ MyTheme }>
				<ThemedTextWithCss>
					This is text with the custom theme using `css`
				</ThemedTextWithCss>
			</ThemeProvider>
		</VStack>
	);
};
