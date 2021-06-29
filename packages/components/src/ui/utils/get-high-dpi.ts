/**
 * External dependencies
 */
// Disable reason: Temporarily disable for existing usages
// until we remove them as part of https://github.com/WordPress/gutenberg/issues/30503#deprecating-emotion-css
// eslint-disable-next-line no-restricted-imports
import { css, CSSInterpolation } from '@emotion/css';

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
