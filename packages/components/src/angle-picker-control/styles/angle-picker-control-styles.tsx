/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { COLORS } from '../../utils';
import { space } from '../../utils/space';
import { Text } from '../../text';
import CONFIG from '../../utils/config-values';

const CIRCLE_SIZE = 32;
const INNER_CIRCLE_SIZE = 6;

export const CircleRoot = styled.div`
	border-radius: ${ CONFIG.radiusRound };
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
	background: ${ COLORS.theme.accent };
	border-radius: ${ CONFIG.radiusRound };
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
	color: ${ COLORS.theme.accent };
	margin-right: ${ space( 3 ) };
`;
