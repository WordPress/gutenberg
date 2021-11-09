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
import CONFIG from '../../utils/config-values';

const CIRCLE_SIZE = 32;
const INNER_CIRCLE_SIZE = 3;

export const Root = styled( Flex )`
	margin-bottom: ${ space( 2 ) };
`;

export const CircleRoot = styled.div`
	border-radius: 50%;
	border: ${ CONFIG.borderWidth } solid ${ COLORS.ui.border };
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
	background: ${ COLORS.admin.theme };
	border-radius: 50%;
	border: ${ INNER_CIRCLE_SIZE }px solid ${ COLORS.admin.theme };
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
