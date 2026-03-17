/**
 * External dependencies
 */
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import CONFIG from './config-values.js';

// This is a very low-level mixin which you shouldn't have to use directly.
// Try to use BaseControl's StyledLabel or BaseControl.VisualLabel if you can.
export const baseLabelTypography = css`
	font-size: 11px;
	font-weight: ${ CONFIG.fontWeightMedium };
	line-height: 1.4;
	text-transform: uppercase;
`;
