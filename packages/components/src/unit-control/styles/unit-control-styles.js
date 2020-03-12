/**
 * External dependencies
 */
import { css } from '@emotion/core';
import styled from '@emotion/styled';
/**
 * Internal dependencies
 */
import { color, rtl } from '../../utils/style-mixins';
import NumberControl from '../../number-control';

export const Root = styled.div`
	box-sizing: border-box;
	position: relative;
`;

const sizeStyles = ( { size } ) => {
	const sizes = {
		default: {
			fontSize: null,
			height: 30,
			lineHeight: 30,
		},
		small: {
			fontSize: 11,
			height: 24,
			lineHeight: 24,
		},
	};

	const style = sizes[ size ] || sizes.default;

	return css( style );
};

export const ValueInput = styled( NumberControl )`
	&&& {
		appearance: none;
		box-sizing: border-box;
		border: 1px solid ${color( 'ui.border' )};
		border-radius: 2px;
		padding: 3px 8px;
		display: block;
		width: 100%;

		&::-webkit-outer-spin-button,
		&::-webkit-inner-spin-button {
			-webkit-appearance: none;
			margin: 0;
		}

		${rtl( { paddingRight: 20 } )}
		${sizeStyles};
	}
`;

const unitHeightStyles = ( { size } ) => {
	const tops = {
		default: 5,
		small: 2,
	};

	return css( { top: tops[ size ] } );
};

const unitLabelStyles = ( props ) => {
	return css`
		appearance: none;
		background: ${color( 'ui.background' )};
		border-radius: 2px;
		border: none;
		box-sizing: border-box;
		color: ${color( 'darkGray.500' )};
		display: block;
		font-size: 8px;
		height: 20px;
		letter-spacing: -0.5px;
		outline: none;
		padding: 2px 2px;
		position: absolute;
		text-align-last: center;
		text-transform: uppercase;
		width: 22px;
		z-index: 1;

		${rtl( { right: 4 } )()}
		${unitHeightStyles( props )}
	`;
};

export const UnitLabel = styled.div`
	&&& {
		${unitLabelStyles};
		padding: 5px 2px;
	}
`;

export const UnitSelect = styled.select`
	&&& {
		${unitLabelStyles};
		cursor: pointer;

		&:hover,
		&:focus {
			box-shadow: 0 0 0 1px ${color( 'ui.border' )} inset;
		}
	}
`;
