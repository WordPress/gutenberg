/**
 * External dependencies
 */
import { css } from '@emotion/core';

export const controlGroupStyles = ( { isFirst, isOnly, isLast, isMiddle } ) => {
	let marginLeft = '';

	if ( ! isFirst && ! isOnly ) {
		marginLeft = css`
			margin-left: -1px;
		`;
	}

	if ( isFirst ) {
		return css`
			border-bottom-right-radius: 0;
			border-top-right-radius: 0;
			${ marginLeft };
		`;
	}
	if ( isMiddle ) {
		return css`
			border-radius: 0;
			${ marginLeft };
		`;
	}
	if ( isLast ) {
		return css`
			border-bottom-left-radius: 0;
			border-top-left-radius: 0;
			${ marginLeft };
		`;
	}
};
