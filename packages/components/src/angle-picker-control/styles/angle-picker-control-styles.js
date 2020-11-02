/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { Flex } from '../../flex';
import { color } from '../../utils/style-mixins';

const CIRCLE_SIZE = 30;

export const Root = styled( Flex )`
	max-width: 200px;
`;

export const CircleRoot = styled.div`
	border-radius: 50%;
	border: 1px solid ${ color( 'ui.borderLight' ) };
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
	background: ${ color( 'ui.border' ) };
	border-radius: 50%;
	border: 3px solid ${ color( 'ui.border' ) };
	bottom: 0;
	box-sizing: border-box;
	display: block;
	height: 1px;
	left: 0;
	margin: auto;
	position: absolute;
	right: 0;
	top: -${ CIRCLE_SIZE / 2 }px;
	width: 1px;
`;
