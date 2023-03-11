/**
 * External dependencies
 */
import { css } from '@emotion/react';
import styled from '@emotion/styled';

/**
 * WordPress dependencies
 */
import { isRTL } from '@wordpress/i18n';

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
const INNER_CIRCLE_SIZE = 24;
const LINE_WEIGHT = 1.5;

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

	> .components-base-control {
		flex: 1;
	}
`;

export const CircleRoot = styled.div`
	border-radius: 50%;
	box-sizing: border-box;
	cursor: grab;
	height: ${ CIRCLE_SIZE }px;
	overflow: hidden;
	width: ${ CIRCLE_SIZE }px;
	margin-inline-end: ${ space( 1 ) };

	:active {
		cursor: grabbing;
	}
`;

export const CircleIndicatorWrapper = styled.div`
	border-radius: 50%;
	box-sizing: border-box;
	position: relative;
	width: ${ INNER_CIRCLE_SIZE }px;
	height: ${ INNER_CIRCLE_SIZE }px;
	margin: ${ ( CIRCLE_SIZE - INNER_CIRCLE_SIZE ) / 2 }px;
	border: ${ CONFIG.borderWidth } solid ${ COLORS.ui.border };

	${ CircleRoot }:is(:hover, :active) > & {
		border-color: ${ COLORS.ui.theme };
	}
`;

export const CircleIndicator = styled.div`
	background: ${ COLORS.ui.theme };
	border-radius: 0 0 ${ LINE_WEIGHT }px ${ LINE_WEIGHT }px;
	box-sizing: border-box;
	display: block;
	left: 50%;
	transform: translateX( -50% );
	position: absolute;
	width: ${ LINE_WEIGHT }px;
	height: calc( 50% + ${ LINE_WEIGHT / 2 }px );
`;

export const UnitText = styled( Text )`
	color: ${ COLORS.ui.theme };
	margin-right: ${ isRTL() ? space( 3 ) : space( 2 ) };
`;
