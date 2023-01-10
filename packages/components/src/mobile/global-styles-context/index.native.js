/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	BLOCK_STYLE_ATTRIBUTES,
	getBlockPaddings,
	getBlockColors,
	getBlockTypography,
} from './utils';

const GlobalStylesContext = createContext( { style: {} } );

GlobalStylesContext.BLOCK_STYLE_ATTRIBUTES = BLOCK_STYLE_ATTRIBUTES;

export const getMergedGlobalStyles = (
	baseGlobalStyles,
	globalStyle,
	wrapperPropsStyle,
	blockAttributes,
	defaultColors,
	blockName,
	fontSizes
) => {
	const baseGlobalColors = {
		baseColors: baseGlobalStyles || {},
	};
	const blockStyleAttributes = Object.fromEntries(
		Object.entries( blockAttributes ?? {} ).filter( ( [ key ] ) =>
			BLOCK_STYLE_ATTRIBUTES.includes( key )
		)
	);

	// This prevents certain wrapper styles from being applied to blocks that
	// don't support them yet.
	const wrapperPropsStyleFiltered = Object.fromEntries(
		Object.entries( wrapperPropsStyle ?? {} ).filter( ( [ key ] ) =>
			BLOCK_STYLE_ATTRIBUTES.includes( key )
		)
	);

	const mergedStyle = {
		...baseGlobalColors,
		...globalStyle,
		...wrapperPropsStyleFiltered,
	};
	const blockColors = getBlockColors(
		blockStyleAttributes,
		defaultColors,
		blockName,
		baseGlobalStyles
	);
	const blockPaddings = getBlockPaddings(
		mergedStyle,
		wrapperPropsStyle,
		blockStyleAttributes,
		blockColors
	);
	const blockTypography = getBlockTypography(
		blockStyleAttributes,
		fontSizes,
		blockName,
		baseGlobalStyles
	);

	return {
		...mergedStyle,
		...blockPaddings,
		...blockColors,
		...blockTypography,
	};
};

export const useGlobalStyles = () => {
	const globalStyles = useContext( GlobalStylesContext );

	return globalStyles;
};

export const withGlobalStyles = ( WrappedComponent ) => ( props ) =>
	(
		<GlobalStylesContext.Consumer>
			{ ( globalStyles ) => (
				<WrappedComponent { ...props } globalStyles={ globalStyles } />
			) }
		</GlobalStylesContext.Consumer>
	);

export default GlobalStylesContext;
