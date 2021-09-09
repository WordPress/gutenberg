/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { Flex } from '../../flex';
import { COLORS } from '../../utils';
import { space } from '../../ui/utils/space';

const CIRCLE_SIZE = 32;

export const Root = styled( Flex )`
	margin-bottom: ${ space( 2 ) };
`;

export const CircleRoot = styled.div`
	border-radius: 50%;
	border: 1px solid ${ COLORS.ui.border };
	box-sizing: border-box;
	cursor: grab;
	height: ${ CIRCLE_SIZE }px;
	overflow: hidden;
	width: ${ CIRCLE_SIZE }px;
`;

export const CircleIndicatorWrapper = styled.div`
	box-sizing: border-box;
	position: relative;
	width: 100%;
	height: 100%;
`;

export const CircleIndicator = styled.div`
	background: #3858e9;
	border-radius: 50%;
	border: 3px solid #3858e9;
	bottom: 0;
	box-sizing: border-box;
	display: block;
	height: 0px;
	left: 0;
	margin: auto;
	position: absolute;
	right: 0;
	top: -${ CIRCLE_SIZE / 2 }px;
	width: 0px;
`;
