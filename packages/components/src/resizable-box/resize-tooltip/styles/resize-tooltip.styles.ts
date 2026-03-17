/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { Text } from '../../../text';
import { font, COLORS, CONFIG } from '../../../utils';

export const Root = styled.div`
	bottom: 0;
	box-sizing: border-box;
	left: 0;
	pointer-events: none;
	position: absolute;
	right: 0;
	top: 0;
`;

export const TooltipWrapper = styled.div`
	align-items: center;
	box-sizing: border-box;
	display: inline-flex;
	justify-content: center;
	opacity: 0;
	pointer-events: none;
	transition: opacity 120ms linear;
`;

export const Tooltip = styled.div`
	background: ${ COLORS.theme.foreground };
	border-radius: ${ CONFIG.radiusSmall };
	box-sizing: border-box;
	font-family: ${ font( 'default.fontFamily' ) };
	font-size: 12px;
	color: ${ COLORS.theme.foregroundInverted };
	padding: 4px 8px;
	position: relative;
`;

// TODO: Resolve need to use &&& to increase specificity
// https://github.com/WordPress/gutenberg/issues/18483

export const LabelText = styled( Text )`
	&&& {
		color: ${ COLORS.theme.foregroundInverted };
		display: block;
		font-size: 13px;
		line-height: 1.4;
		white-space: nowrap;
	}
`;
