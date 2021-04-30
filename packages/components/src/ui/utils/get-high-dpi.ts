/**
 * External dependencies
 */
import type { Interpolation } from '@emotion/core';
import { css } from 'emotion';

export function getHighDpi(
	strings: TemplateStringsArray,
	...interpolations: Interpolation[]
) {
	const interpolatedStyles = css( strings, ...interpolations );

	return css`
		@media ( -webkit-min-device-pixel-ratio: 1.25 ),
			( min-resolution: 120dpi ) {
			${ interpolatedStyles }
		}
	`;
}
