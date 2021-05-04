/**
 * External dependencies
 */
import { css } from '@emotion/css';
// eslint-disable-next-line no-duplicate-imports
import type { CSSInterpolation } from '@emotion/css';

export function getHighDpi(
	strings: TemplateStringsArray,
	...interpolations: CSSInterpolation[]
) {
	const interpolatedStyles = css( strings, ...interpolations );

	return css`
		@media ( -webkit-min-device-pixel-ratio: 1.25 ),
			( min-resolution: 120dpi ) {
			${ interpolatedStyles }
		}
	`;
}
