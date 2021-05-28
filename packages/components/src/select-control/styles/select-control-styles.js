/**
 * External dependencies
 */
import { css } from '@emotion/core';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { COLORS, rtl } from '../../utils';

const disabledStyles = ( { disabled } ) => {
	if ( ! disabled ) return '';

	return css( {
		color: COLORS.ui.textDisabled,
	} );
};

const fontSizeStyles = ( { size } ) => {
	const sizes = {
		default: '13px',
		small: '11px',
	};

	const fontSize = sizes[ size ];
	const fontSizeMobile = '16px';

	if ( ! fontSize ) return '';

	return css`
		font-size: ${ fontSizeMobile };

		@media ( min-width: 600px ) {
			font-size: ${ fontSize };
		}
	`;
};

const sizeStyles = ( { size } ) => {
	const sizes = {
		default: {
			height: 30,
			lineHeight: 1,
			minHeight: 30,
		},
		small: {
			height: 24,
			lineHeight: 1,
			minHeight: 24,
		},
	};

	const style = sizes[ size ] || sizes.default;

	return css( style );
};

// TODO: Resolve need to use &&& to increase specificity
// https://github.com/WordPress/gutenberg/issues/18483

export const Select = styled.select`
	&&& {
		appearance: none;
		background: transparent;
		box-sizing: border-box;
		border: none;
		box-shadow: none !important;
		color: ${ COLORS.black };
		display: block;
		margin: 0;
		width: 100%;

		${ disabledStyles };
		${ fontSizeStyles };
		${ sizeStyles };

		${ rtl( { paddingLeft: 8, paddingRight: 24 } )() }
	}
`;

export const DownArrowWrapper = styled.div`
	align-items: center;
	bottom: 0;
	box-sizing: border-box;
	display: flex;
	padding: 0 4px;
	pointer-events: none;
	position: absolute;
	top: 0;

	${ rtl( { right: 0 } )() }

	svg {
		display: block;
	}
`;
