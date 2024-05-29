/**
 * External dependencies
 */
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import { COLORS } from '../colors-values';
import { CONFIG } from '../';

export const inputStyleNeutral = css`
	box-shadow: 0 0 0 transparent;
	border-radius: ${ CONFIG.radiusBlockUi };
	border: ${ CONFIG.borderWidth } solid ${ COLORS.ui.border };

	@media not ( prefers-reduced-motion ) {
		transition: box-shadow 0.1s linear;
	}
`;

export const inputStyleFocus = css`
	border-color: ${ COLORS.theme.accent };
	box-shadow: 0 0 0
		calc( ${ CONFIG.borderWidthFocus } - ${ CONFIG.borderWidth } )
		${ COLORS.theme.accent };

	// Windows High Contrast mode will show this outline, but not the box-shadow.
	outline: 2px solid transparent;
`;
