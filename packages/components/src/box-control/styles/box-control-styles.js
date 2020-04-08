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
`;

export const Header = styled( Flex )`
	margin-bottom: 8px;
`;

export const UnitControlWrapper = styled.div`
	box-sizing: border-box;
	max-width: 75px;
`;

export const LayoutContainer = styled( Flex )`
	height: 120px;
	justify-content: center;
	padding-bottom: 16px;
`;

export const Layout = styled.div`
	box-sizing: border-box;
	position: relative;
	height: 120px;
	width: 200px;
`;

export const LayoutBox = styled.div`
	position: absolute;
	box-sizing: border-box;
	top: 12px;
	bottom: 12px;
	left: 30px;
	right: 30px;
	pointer-events: none;
	border: 1px solid ${color( 'ui.borderLight' )};
`;

export const SideIndicator = styled.div`
	height: 50%;
	border-left: 1px dashed ${color( 'ui.borderLight' )};
	width: 0;
	position: absolute;
	pointer-events: none;
`;
