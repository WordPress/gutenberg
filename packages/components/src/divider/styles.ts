/**
 * External dependencies
 */
// Disable reason: Temporarily disable for existing usages
// until we remove them as part of https://github.com/WordPress/gutenberg/issues/30503#deprecating-emotion-css
// eslint-disable-next-line no-restricted-imports
import { css } from '@emotion/css';

/**
 * Internal dependencies
 */
import CONFIG from '../utils/config-values';

export const Divider = css`
	border-color: ${ CONFIG.colorDivider };
	border-width: 0 0 1px 0;
	height: 0;
	margin: 0;
	width: auto;
`;
