/**
 * External dependencies
 */
import { find, pick, startsWith } from 'lodash';

/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const GlobalStylesContext = createContext( { style: {} } );

const BLOCK_STYLE_ATTRIBUTES = [ 'textColor', 'backgroundColor' ];

// Mapping style properties name to native
const BLOCK_STYLE_ATTRIBUTES_MAPPING = {
	textColor: 'color',
};

export const getMergedGlobalStyles = (
	globalStyle,
	wrapperPropsStyle,
	blockAttributes,
	defaultColors
) => {
	const blockStyleAttributes = pick(
		blockAttributes,
		BLOCK_STYLE_ATTRIBUTES
	);
	const mergedStyle = {
		...globalStyle,
		...wrapperPropsStyle,
	};

	if (
		wrapperPropsStyle?.backgroundColor ||
		blockStyleAttributes?.backgroundColor
	) {
		mergedStyle.padding = styles.withBackGroundColor.paddingLeft;
	}

	Object.entries( blockStyleAttributes ).forEach( ( [ key, value ] ) => {
		const isCustomColor = startsWith( value, '#' );
		let styleKey = key;

		if ( BLOCK_STYLE_ATTRIBUTES_MAPPING[ styleKey ] ) {
			styleKey = BLOCK_STYLE_ATTRIBUTES_MAPPING[ styleKey ];
		}

		if ( ! isCustomColor ) {
			const mappedColor = find( defaultColors, {
				slug: value,
			} );

			if ( mappedColor ) {
				mergedStyle[ styleKey ] = mappedColor.color;
			}
		} else {
			mergedStyle[ styleKey ] = value;
		}
	} );

	return mergedStyle;
};

export const useGlobalStyles = () => {
	const globalStyles = useContext( GlobalStylesContext );

	return globalStyles;
};

export const withGlobalStyles = ( WrappedComponent ) => ( props ) => (
	<GlobalStylesContext.Consumer>
		{ ( globalStyles ) => (
			<WrappedComponent { ...props } globalStyles={ globalStyles } />
		) }
	</GlobalStylesContext.Consumer>
);

export default GlobalStylesContext;
