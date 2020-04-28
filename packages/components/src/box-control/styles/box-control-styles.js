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
	box-sizing: border-box;
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
	max-width: 80px;
`;

export const LayoutContainer = styled( Flex )`
	height: 100px;
	justify-content: center;
`;

export const Layout = styled.div`
	box-sizing: border-box;
	position: relative;
	height: 100%;
	width: 100%;
`;

export const LayoutBox = styled.div`
	border: 1px solid ${color( 'ui.borderLight' )};
	bottom: 12px;
	box-sizing: border-box;
	left: 40px;
	pointer-events: none;
	position: absolute;
	right: 40px;
	top: 12px;
`;
