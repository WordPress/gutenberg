/**
 * External dependencies
 */
import { css } from '@emotion/react';

// This is a very low-level mixin which you shouldn't have to use directly.
// Try to use BaseControl's StyledLabel or BaseControl.VisualLabel if you can.
export const baseLabelTypography = css`
	font-size: 11px;
	font-weight: 500;
	line-height: 1.4;
	text-transform: uppercase;
`;
