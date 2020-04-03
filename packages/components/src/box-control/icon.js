/**
 * External dependencies
 */
import { css } from '@emotion/core';
import styled from '@emotion/styled';
/**
 * Internal dependencies
 */
import { color } from '../utils/style-mixins';

const BASE_ICON_SIZE = 24;

export default function BoxControlIcon( { size = 24, sides = [ 'all' ] } ) {
	const top = getSide( sides, 'top' );
	const right = getSide( sides, 'right' );
	const bottom = getSide( sides, 'bottom' );
	const left = getSide( sides, 'left' );

	// Simulates SVG Icon scaling
	const scale = size / BASE_ICON_SIZE;

	return (
		<Root style={ { transform: `scale(${ scale })` } }>
			<Viewbox>
				<TopStroke isFocused={ top } />
				<RightStroke isFocused={ right } />
				<BottomStroke isFocused={ bottom } />
				<LeftStroke isFocused={ left } />
			</Viewbox>
		</Root>
	);
}

function getSide( sides, value ) {
	const match = value.toLowerCase();

	return sides.find( ( side ) => {
		const sideValue = side.toLowerCase();
		return [ 'all', match ].includes( sideValue );
	} );
}

const Root = styled.span`
	box-sizing: border-box;
	display: block;
	width: 24px;
	height: 24px;
	position: relative;
	padding: 4px;
`;

const Viewbox = styled.span`
	box-sizing: border-box;
	display: block;
	position: relative;
	width: 100%;
	height: 100%;
`;

const strokeFocus = ( { isFocused } ) => {
	return css( {
		backgroundColor: color( 'ui.border' ),
		opacity: isFocused ? 1 : 0.3,
	} );
};

const Stroke = styled.span`
	box-sizing: border-box;
	display: block;
	pointer-events: none;
	position: absolute;
	${strokeFocus};
`;

const VerticalStroke = styled( Stroke )`
	bottom: 3px;
	top: 3px;
	width: 2px;
`;

const HorizontalStroke = styled( Stroke )`
	height: 2px;
	left: 3px;
	right: 3px;
`;

const TopStroke = styled( HorizontalStroke )`
	top: 0;
`;

const RightStroke = styled( VerticalStroke )`
	right: 0;
`;

const BottomStroke = styled( HorizontalStroke )`
	bottom: 0;
`;

const LeftStroke = styled( VerticalStroke )`
	left: 0;
`;
