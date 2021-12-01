/**
 * External dependencies
 */
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import { COLORS, CONFIG } from '../utils';
import { space } from '../ui/utils/space';

const InfoWrapper = css`
	display: flex;
	flex-direction: column;
	margin-right: auto;
	.components-menu-item__item {
		// Provide a minimum width for text items in menus.
		white-space: nowrap;
		min-width: 160px;
		margin-right: auto;
		display: inline-flex;
		align-items: center;
	}
	.components-menu-item__info {
		margin-top: ${ space( 1 ) };
		font-size: ${ CONFIG.fontSizeSmall };
		color: ${ COLORS.gray[ 700 ] };
		white-space: normal;
	}
`;
