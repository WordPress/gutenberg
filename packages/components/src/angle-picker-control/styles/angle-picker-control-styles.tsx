/**
 * External dependencies
 */
import { css } from '@emotion/react';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { Flex } from '../../flex';
import { COLORS } from '../../utils';
import { space } from '../../ui/utils/space';
import CONFIG from '../../utils/config-values';

import type { AnglePickerControlProps } from '../types';

const CIRCLE_SIZE = 32;
const INNER_CIRCLE_SIZE = 3;

const deprecatedBottomMargin = ( {
	__nextHasNoMarginBottom,
}: Pick< AnglePickerControlProps, '__nextHasNoMarginBottom' > ) => {
	return ! __nextHasNoMarginBottom
		? css`
				margin-bottom: ${ space( 2 ) };
		  `
		: '';
};

export const Root = styled( Flex )`
	${ deprecatedBottomMargin }
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

	:focus-visible {
		outline: none;
	}
`;

export const CircleIndicator = styled.div`
	background: ${ COLORS.ui.theme };
	border-radius: 50%;
	border: ${ INNER_CIRCLE_SIZE }px solid ${ COLORS.ui.theme };
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
