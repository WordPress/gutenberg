/**
 * External dependencies
 */
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import { CONFIG, COLORS } from '../../utils';
import { rgba } from '../../utils/colors';
import { space } from '../../ui/utils/space';

export const ToolTip = css`
	background: ${ rgba( '#1e1e1e', 1 ) };
	color: ${ COLORS.ui.textDark };
	text-align: center;
	line-height: ${ CONFIG.fontLineHeightBase };
	font-size: ${ CONFIG.fontSizeSmall };
	padding: ${ space( 1 ) } ${ space( 2 ) };
	z-index: 1000002;
`;

export const ToolTipAnchor = css`
	display: inline-block;
`;

export const Shortcut = css`
	margin-left: ${ space( 2 ) };
`;
