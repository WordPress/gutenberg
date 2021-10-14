/**
 * External dependencies
 */
import { css } from '@emotion/react';

export const wrapper = css`
	z-index: 9999999;
`;

export const stackedMarginWrapper = css`
	* {
		margin-top: 0;
		margin-bottom: 0;
	}

	> * + * {
		margin-top: 2rem;
	}
`;

// @todo it's unfortunate that I had to hardcode 24px below, given the SCSSs use
// variables (i.e  https://github.com/WordPress/gutenberg/blob/trunk/packages/components/src/modal/style.scss#L112)
// Should I perhaps use any of the consts from here? https://github.com/WordPress/gutenberg/blob/trunk/packages/components/src/utils/config-values.js?
// if you know a better way to adjust this, let me know! -Marcelo
export const withoutTitle = css`
	.components-modal__header {
		display: none;
	}

	.components-modal__content {
		margin: 0;
		padding-top: 24px;
	}
`;
