/**
 * External dependencies
 */
import { css, SerializedStyles } from '@emotion/react';
import styled from '@emotion/styled';
import type { CSSProperties, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../../ui/context';
import { Flex, FlexItem } from '../../flex';
import { Text } from '../../text';
import { COLORS, rtl } from '../../utils';
import type { LabelPosition, Size } from '../types';

type ContainerProps = {
	disabled?: boolean;
	hideLabel?: boolean;
	__unstableInputWidth?: CSSProperties[ 'width' ];
	labelPosition?: LabelPosition;
};

type RootProps = {
	isFocused?: boolean;
	labelPosition?: LabelPosition;
};

const rootFocusedStyles = ( { isFocused }: RootProps ) => {
	if ( ! isFocused ) return '';

	return css( { zIndex: 1 } );
};

const rootLabelPositionStyles = ( { labelPosition }: RootProps ) => {
	switch ( labelPosition ) {
		case 'top':
			return css`
				align-items: flex-start;
				flex-direction: column;
			`;
		case 'bottom':
			return css`
				align-items: flex-start;
				flex-direction: column-reverse;
			`;
		case 'edge':
			return css`
				justify-content: space-between;
			`;
		default:
			return '';
	}
};

export const Root = styled( Flex )< RootProps >`
	position: relative;
	border-radius: 2px;
	padding-top: 0;
	${ rootFocusedStyles }
	${ rootLabelPositionStyles }
`;

const containerDisabledStyles = ( { disabled }: ContainerProps ) => {
	const backgroundColor = disabled
		? COLORS.ui.backgroundDisabled
		: COLORS.ui.background;

	return css( { backgroundColor } );
};

// Normalizes the margins from the <Flex /> (components/ui/flex/) container.
const containerMarginStyles = ( { hideLabel }: ContainerProps ) => {
	return hideLabel ? css( { margin: '0 !important' } ) : null;
};

const containerWidthStyles = ( {
	__unstableInputWidth,
	labelPosition,
}: ContainerProps ) => {
	if ( ! __unstableInputWidth ) return css( { width: '100%' } );

	if ( labelPosition === 'side' ) return '';

	if ( labelPosition === 'edge' ) {
		return css( {
			flex: `0 0 ${ __unstableInputWidth }`,
		} );
	}

	return css( { width: __unstableInputWidth } );
};

export const Container = styled.div< ContainerProps >`
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

type InputProps = {
	disabled?: boolean;
	inputSize?: Size;
	isDragging?: boolean;
	dragCursor?: CSSProperties[ 'cursor' ];
};

const disabledStyles = ( { disabled }: InputProps ) => {
	if ( ! disabled ) return '';

	return css( {
		color: COLORS.ui.textDisabled,
	} );
};

const fontSizeStyles = ( { inputSize: size }: InputProps ) => {
	const sizes = {
		default: '13px',
		small: '11px',
		'__unstable-large': '13px',
	};

	const fontSize = sizes[ size as Size ] || sizes.default;
	const fontSizeMobile = '16px';

	if ( ! fontSize ) return '';

	return css`
		font-size: ${ fontSizeMobile };

		@media ( min-width: 600px ) {
			font-size: ${ fontSize };
		}
	`;
};

const sizeStyles = ( { inputSize: size }: InputProps ) => {
	const sizes = {
		default: {
			height: 30,
			lineHeight: 1,
			minHeight: 30,
			paddingLeft: 8,
			paddingRight: 8,
		},
		small: {
			height: 24,
			lineHeight: 1,
			minHeight: 24,
			paddingLeft: 8,
			paddingRight: 8,
		},
		'__unstable-large': {
			height: 40,
			lineHeight: 1,
			minHeight: 40,
			paddingLeft: 16,
			paddingRight: 16,
		},
	};

	const style = sizes[ size as Size ] || sizes.default;

	return css( style );
};

const dragStyles = ( { isDragging, dragCursor }: InputProps ) => {
	let defaultArrowStyles: SerializedStyles | undefined;
	let activeDragCursorStyles: SerializedStyles | undefined;

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

export const Input = styled.input< InputProps >`
	&&& {
		background-color: transparent;
		box-sizing: border-box;
		border: none;
		box-shadow: none !important;
		color: ${ COLORS.black };
		display: block;
		margin: 0;
		outline: none;
		width: 100%;

		${ dragStyles }
		${ disabledStyles }
		${ fontSizeStyles }
		${ sizeStyles }

		&::-webkit-input-placeholder {
			line-height: normal;
		}
	}
`;

const labelMargin = ( {
	labelPosition,
}: {
	labelPosition?: LabelPosition;
} ) => {
	let marginBottom = 8;

	if ( labelPosition === 'edge' || labelPosition === 'side' ) {
		marginBottom = 0;
	}

	return css( { marginTop: 0, marginRight: 0, marginBottom, marginLeft: 0 } );
};

const BaseLabel = styled( Text )< { labelPosition?: LabelPosition } >`
	&&& {
		box-sizing: border-box;
		color: currentColor;
		display: block;
		padding-top: 0;
		padding-bottom: 0;
		max-width: 100%;
		z-index: 1;

		${ labelMargin }
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
`;

export const Label = (
	props: WordPressComponentProps<
		{ labelPosition?: LabelPosition; children: ReactNode },
		'label',
		false
	>
) => <BaseLabel { ...props } as="label" />;

export const LabelWrapper = styled( FlexItem )`
	max-width: calc( 100% - 10px );
`;

type BackdropProps = {
	disabled?: boolean;
	isFocused?: boolean;
};

const backdropFocusedStyles = ( {
	disabled,
	isFocused,
}: BackdropProps ): SerializedStyles => {
	let borderColor = isFocused ? COLORS.ui.borderFocus : COLORS.ui.border;

	let boxShadow;

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

export const BackdropUI = styled.div< BackdropProps >`
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
	align-items: center;
	align-self: stretch;
	box-sizing: border-box;
	display: flex;
`;
