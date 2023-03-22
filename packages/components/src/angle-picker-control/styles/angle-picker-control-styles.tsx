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
import { Text } from '../../text';
import CONFIG from '../../utils/config-values';

import type { AnglePickerControlProps } from '../types';

const CIRCLE_SIZE = 32;
const INNER_CIRCLE_SIZE = 6;

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

	:active {
		cursor: grabbing;
	}
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
	box-sizing: border-box;
	display: block;
	left: 50%;
	top: 4px;
	transform: translateX( -50% );
	position: absolute;
	width: ${ INNER_CIRCLE_SIZE }px;
	height: ${ INNER_CIRCLE_SIZE }px;
`;

export const UnitText = styled( Text )`
	color: ${ COLORS.ui.theme };
	margin-right: ${ space( 3 ) };
`;
