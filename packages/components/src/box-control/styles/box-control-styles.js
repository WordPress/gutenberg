/**
 * External dependencies
 */
import styled from '@emotion/styled';
/**
 * Internal dependencies
 */
import { Flex } from '../../flex';
import { color } from '../../utils/style-mixins';

export const Root = styled.div`
	max-width: 300px;
	padding-bottom: 12px;
	width: 100%;
`;

export const Header = styled( Flex )`
	color: ${color( 'ui.label' )};
	padding-bottom: 8px;
`;

export const UnitControlWrapper = styled.div`
	box-sizing: border-box;
	max-width: 75px;
`;

export const LayoutContainer = styled( Flex )`
	height: 120px;
	justify-content: center;
`;

export const Layout = styled.div`
	box-sizing: border-box;
	position: relative;
	height: 120px;
	width: 100%;
`;

export const LayoutBox = styled.div`
	position: absolute;
	box-sizing: border-box;
	top: 12px;
	bottom: 12px;
	left: 30px;
	right: 30px;
	pointer-events: none;
	border: 1px dashed ${color( 'ui.borderLight' )};
`;

export const SideIndicator = styled.div`
	box-sizing: border-box;
	position: absolute;
	pointer-events: none;
`;

export const SideIndicatorX = styled( SideIndicator )`
	border-top: 1px solid ${color( 'ui.borderLight' )};
	top: 50%;
	left: 0;
	width: 100%;
`;

export const SideIndicatorY = styled( SideIndicator )`
	border-left: 1px solid ${color( 'ui.borderLight' )};
	top: 50%;
	left: 50%;
	transform: translate( 0, -50% );
	height: 100%;
`;

export const Prefix = styled.div`
	box-sizing: border-box;
	color: ${color( 'ui.label' )};
	font-size: 12px;
	line-height: 1;
	margin-right: -8px;
	text-align: center;
	width: 20px;
	user-select: none;
`;
