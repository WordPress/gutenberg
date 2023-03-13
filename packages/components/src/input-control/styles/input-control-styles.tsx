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
import { baseLabelTypography, COLORS, rtl } from '../../utils';
import type { LabelPosition, Size } from '../types';
import { space } from '../../ui/utils/space';

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

export const Root = styled( Flex )< RootProps >`
	box-sizing: border-box;
	position: relative;
	border-radius: 2px;
	padding-top: 0;
	${ rootFocusedStyles }
`;

const containerDisabledStyles = ( { disabled }: ContainerProps ) => {
	const backgroundColor = disabled
		? COLORS.ui.backgroundDisabled
		: COLORS.ui.background;

	return css( { backgroundColor } );
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
	${ containerWidthStyles }
`;

type InputProps = {
	__next36pxDefaultSize?: boolean;
	disabled?: boolean;
	inputSize?: Size;
	isDragging?: boolean;
	dragCursor?: CSSProperties[ 'cursor' ];
	paddingInlineStart?: CSSProperties[ 'paddingInlineStart' ];
	paddingInlineEnd?: CSSProperties[ 'paddingInlineEnd' ];
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

export const getSizeConfig = ( {
	inputSize: size,
	__next36pxDefaultSize,
}: InputProps ) => {
	// Paddings may be overridden by the custom paddings props.
	const sizes = {
		default: {
			height: 36,
			lineHeight: 1,
			minHeight: 36,
			paddingLeft: space( 4 ),
			paddingRight: space( 4 ),
		},
		small: {
			height: 24,
			lineHeight: 1,
			minHeight: 24,
			paddingLeft: space( 2 ),
			paddingRight: space( 2 ),
		},
		'__unstable-large': {
			height: 40,
			lineHeight: 1,
			minHeight: 40,
			paddingLeft: space( 4 ),
			paddingRight: space( 4 ),
		},
	};

	if ( ! __next36pxDefaultSize ) {
		sizes.default = {
			height: 30,
			lineHeight: 1,
			minHeight: 30,
			paddingLeft: space( 2 ),
			paddingRight: space( 2 ),
		};
	}

	return sizes[ size as Size ] || sizes.default;
};

const sizeStyles = ( props: InputProps ) => {
	return css( getSizeConfig( props ) );
};

const customPaddings = ( {
	paddingInlineStart,
	paddingInlineEnd,
}: InputProps ) => {
	return css( { paddingInlineStart, paddingInlineEnd } );
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
		color: ${ COLORS.gray[ 900 ] };
		display: block;
		font-family: inherit;
		margin: 0;
		outline: none;
		width: 100%;

		${ dragStyles }
		${ disabledStyles }
		${ fontSizeStyles }
		${ sizeStyles }
		${ customPaddings }

		&::-webkit-input-placeholder {
			line-height: normal;
		}
	}
`;

const BaseLabel = styled( Text )< { labelPosition?: LabelPosition } >`
	&&& {
		${ baseLabelTypography };

		box-sizing: border-box;
		display: block;
		padding-top: 0;
		padding-bottom: 0;
		max-width: 100%;
		z-index: 1;

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
