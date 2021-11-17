/**
 * External dependencies
 */
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import { COLORS, CONFIG } from '../utils';
import { space } from '../ui/utils/space';

export const MenuGroup = css`
	margin-top: ${ space( 2 ) };
	padding-top: ${ space( 2 ) };
	border-top: ${ CONFIG.borderWidth } solid ${ COLORS.gray[ 900 ] };
`;

export const MenuGroupWithHiddenSeparator = css`
	border-top: none;
	margin-top: 0;
	padding-top: 0;
`;

export const MenuGroupLabel = css`
	padding: 0 ${ space( 2 ) };
	margin-top: ${ space( 1 ) };
	margin-bottom: ${ space( 3 ) };
	color: ${ COLORS.gray[ 700 ] };
	text-transform: uppercase;
	font-size: ${ CONFIG.fontSizeSmall };
	font-weight: ${ CONFIG.fontWeightHeading };
	white-space: nowrap;
`;
