/**
 * External dependencies
 */
import { css } from '@emotion/react';
import styled from '@emotion/styled';
// eslint-disable-next-line no-restricted-imports
import { motion } from 'framer-motion';

/**
 * Internal dependencies
 */
import { CONFIG, COLORS } from '../../utils';

export const ToggleGroupControl = css`
	background: ${ COLORS.ui.background };
	border: 1px solid;
	border-color: ${ COLORS.ui.border };
	border-radius: ${ CONFIG.controlBorderRadius };
	display: inline-flex;
	min-height: ${ CONFIG.controlHeight };
	min-width: 0;
	&:hover {
		border-color: ${ COLORS.ui.borderHover };
	}

	&:focus-within {
		border-color: ${ COLORS.ui.borderFocus };
		box-shadow: ${ CONFIG.controlBoxShadowFocus };
		outline: none;
		z-index: 1;
	}
`;

export const block = css`
	display: flex;
`;

export const Liner = styled( 'div' )`
	position: relative;
	display: flex;
	width: 100%;
	margin: 2px;
`;


export const AnimatedBackdrop = styled( motion.div )`
	background: ${ COLORS.gray[ 900 ] };
	border-radius: ${ CONFIG.controlBorderRadius };
	box-shadow: none;
	left: 0;
	position: absolute;
	top: 0;
	bottom: 0;
	z-index: 1;
`;
