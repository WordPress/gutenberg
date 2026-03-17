/**
 * External dependencies
 */
import { css } from '@emotion/react';

/**
 * The z-index for ConfirmDialog is being set here instead of in
 * packages/base-styles/_z-index.scss, because this component uses
 * emotion instead of sass.
 *
 * ConfirmDialog needs this higher z-index to ensure it renders on top of
 * any parent Popover component.
 */
export const wrapper = css`
	&& {
		z-index: 1000001;
	}
`;
