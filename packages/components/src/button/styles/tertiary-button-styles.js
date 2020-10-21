/**
 * External dependencies
 */
import { css } from '@emotion/core';

/**
 * Internal dependencies
 */
import { secondaryAndTertiaryBase } from './base-styles';

export const styles = css`
	${ secondaryAndTertiaryBase }

	white-space: nowrap;
	color: var( --wp-admin-theme-color );
	background: transparent;
	padding: 6px; // This reduces the horizontal padding on tertiary/text buttons, so as to space them optically.

	.dashicon {
		display: inline-block;
		flex: 0 0 auto;
	}
`;
