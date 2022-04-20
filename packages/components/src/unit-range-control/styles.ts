/**
 * External dependencies
 */
import { css } from '@emotion/react';
import type { CSSProperties } from 'react';

/**
 * Internal dependencies
 */
import { StyledField } from '../base-control/styles/base-control-styles';
import { Root as UnitControlWrapper } from '../unit-control/styles/unit-control-styles';

export const unitRangeControl = css``;
export const unitControl = css`
	${ UnitControlWrapper } {
		flex: 1;
	}
`;
export const rangeControl = css`
	flex: 1 1 50%;

	${ StyledField } {
		margin-bottom: 0;
		font-size: 0;
		display: flex;
	}
`;
