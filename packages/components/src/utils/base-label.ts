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
	font-size: ${ CONFIG.fontSize };
	font-weight: ${ CONFIG.fontWeight };
	line-height: 1.4;
`;
