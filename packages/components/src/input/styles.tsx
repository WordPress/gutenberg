/**
 * External dependencies
 */
import { css } from '@emotion/react';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { Flex } from '../flex';
import { COLORS, rtl } from '../utils';

const rootFloatLabelStyles = () => {
	return css( { paddingTop: 0 } );
};

const rootFocusedStyles = ( { isFocused } ) => {
	if ( ! isFocused ) return '';

	return css( { zIndex: 1 } );
};

export const Root = styled( Flex )< { isFocused: boolean } >`
	position: relative;
	border-radius: 2px;

	${ rootFloatLabelStyles() }
	${ rootFocusedStyles }
`;

const containerDisabledStyles = ( { disabled } ) => {
	const backgroundColor = disabled
		? COLORS.ui.backgroundDisabled
		: COLORS.ui.background;

	return css( { backgroundColor } );
};

// Normalizes the margins from the <Flex /> (components/ui/flex/) container.
const containerMarginStyles = ( { hideLabel } ) => {
	return hideLabel ? css( { margin: '0 !important' } ) : null;
};

const containerWidthStyles = ( { __unstableInputWidth, labelPosition } ) => {
	if ( ! __unstableInputWidth ) return css( { width: '100%' } );

	if ( labelPosition === 'side' ) return '';

	if ( labelPosition === 'edge' ) {
		return css( {
			flex: `0 0 ${ __unstableInputWidth }`,
		} );
	}

	return css( { width: __unstableInputWidth } );
};

export const Container = styled.div< {
	disabled: boolean;
	hideLabel: boolean;
	__unstableInputWidth: string;
	labelPosition: 'side' | 'edge';
} >`
	align-items: center;
	box-sizing: border-box;
	border-radius: inherit;
	display: flex;
	flex: 1;
	position: relative;

	${ containerDisabledStyles }
	${ containerMarginStyles }
	 ${ containerWidthStyles }
`;

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

const placeholderStyles = () => {
	return css`
		&::-webkit-input-placeholder {
			line-height: normal;
		}
	`;
};

const dragStyles = ( { isDragging, dragCursor } ) => {
	let defaultArrowStyles;
	let activeDragCursorStyles;

	if ( isDragging ) {
		defaultArrowStyles = css`
			cursor: ${ dragCursor };
			user-select: none;

			&::-webkit-outer-spin-button,
			&::-webkit-inner-spin-button {
				-webkit-appearance: none !important;
				margin: 0 !important;
			}
		`;
	}

	if ( isDragging && dragCursor ) {
		activeDragCursorStyles = css`
			&:active {
				cursor: ${ dragCursor };
			}
		`;
	}

	return css`
		${ defaultArrowStyles }
		${ activeDragCursorStyles }
	`;
};

// TODO: Resolve need to use &&& to increase specificity
// https://github.com/WordPress/gutenberg/issues/18483

export const Input = styled.input<
	Partial< {
		isDragging: boolean;
		dragCursor: 'ns-resize' | 'ew-resize';
		disabled: boolean;
		size: 'default' | 'small';
	} >
>`
	&&& {
		background-color: transparent;
		box-sizing: border-box;
		border: none;
		box-shadow: none !important;
		color: ${ COLORS.black };
		display: block;
		margin: 0;
		outline: none;
		padding-left: 8px;
		padding-right: 8px;
		width: 100%;

		${ dragStyles }
		${ disabledStyles }
		 ${ fontSizeStyles }
		 ${ sizeStyles }

		 ${ placeholderStyles }
	}
`;

const backdropFocusedStyles = ( { disabled, isFocused } ) => {
	let borderColor = isFocused ? COLORS.ui.borderFocus : COLORS.ui.border;

	let boxShadow = null;

	if ( isFocused ) {
		boxShadow = `0 0 0 1px ${ COLORS.ui.borderFocus } inset`;
	}

	if ( disabled ) {
		borderColor = COLORS.ui.borderDisabled;
	}

	return css( {
		boxShadow,
		borderColor,
		borderStyle: 'solid',
		borderWidth: 1,
	} );
};

export const BackdropUI = styled.div< {
	disabled: boolean;
	isFocused: boolean;
} >`
	&&& {
		box-sizing: border-box;
		border-radius: inherit;
		bottom: 0;
		left: 0;
		margin: 0;
		padding: 0;
		pointer-events: none;
		position: absolute;
		right: 0;
		top: 0;

		${ backdropFocusedStyles }
		${ rtl( { paddingLeft: 2 } ) }
	}
`;

export const Prefix = styled.span`
	box-sizing: border-box;
	display: block;
`;

export const Suffix = styled.span`
	box-sizing: border-box;
	display: block;
`;
