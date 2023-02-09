/**
 * External dependencies
 */
import { css } from '@emotion/react';
import styled from '@emotion/styled';

export const Root = styled.span`
	box-sizing: border-box;
	display: block;
	width: 24px;
	height: 24px;
	position: relative;
	padding: 4px;
`;

export const Viewbox = styled.span`
	box-sizing: border-box;
	display: block;
	position: relative;
	width: 100%;
	height: 100%;
`;

const strokeFocus = ( { isFocused }: { isFocused: boolean } ) => {
	return css( {
		backgroundColor: 'currentColor',
		opacity: isFocused ? 1 : 0.3,
	} );
};

const Stroke = styled.span`
	box-sizing: border-box;
	display: block;
	pointer-events: none;
	position: absolute;
	${ strokeFocus };
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

export const TopStroke = styled( HorizontalStroke )`
	top: 0;
`;

export const RightStroke = styled( VerticalStroke )`
	right: 0;
`;

export const BottomStroke = styled( HorizontalStroke )`
	bottom: 0;
`;

export const LeftStroke = styled( VerticalStroke )`
	left: 0;
`;
