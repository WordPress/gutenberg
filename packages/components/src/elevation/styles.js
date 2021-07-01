/**
 * External dependencies
 */
// Disable reason: Temporarily disable for existing usages
// until we remove them as part of https://github.com/WordPress/gutenberg/issues/30503#deprecating-emotion-css
// eslint-disable-next-line no-restricted-imports
import { css } from '@emotion/css';

export const Elevation = css`
	background: transparent;
	display: block;
	margin: 0 !important;
	pointer-events: none;
	position: absolute;
	will-change: box-shadow;
`;
