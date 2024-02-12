/**
 * External dependencies
 */
import type { SerializedStyles } from '@emotion/react';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import type { CSSProperties, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../../context';
import { FlexItem } from '../../flex';
import { Text } from '../../text';
import { baseLabelTypography, COLORS, CONFIG } from '../../utils';
import type { LabelPosition, Size } from '../types';
import { space } from '../../utils/space';

export const inputBaseFocusedStyles = ( isFocused?: boolean ) => {
	if ( ! isFocused ) return '';

	return css( { zIndex: 1 } );
};

export const inputBase = css`
	box-sizing: border-box;
	position: relative;
	border-radius: 2px;
	padding-top: 0;
`;

export const inputBaseContainerDisabledStyles = ( disabled?: boolean ) => {
	const backgroundColor = disabled
		? COLORS.ui.backgroundDisabled
		: COLORS.ui.background;

	return css( { backgroundColor } );
};

export const inputBaseContainerWidthStyles = ( {
	__unstableInputWidth,
	labelPosition,
}: {
	__unstableInputWidth?: CSSProperties[ 'width' ];
	labelPosition?: LabelPosition;
} ) => {
	if ( ! __unstableInputWidth ) return css( { width: '100%' } );

	if ( labelPosition === 'side' ) return '';

	if ( labelPosition === 'edge' ) {
		return css( {
			flex: `0 0 ${ __unstableInputWidth }`,
		} );
	}

	return css( { width: __unstableInputWidth } );
};

export const inputBaseContainer = css`
	align-items: center;
	box-sizing: border-box;
	border-radius: inherit;
	display: flex;
	flex: 1;
	position: relative;
`;

type InputSizeProps = {
	__next40pxDefaultSize?: boolean;
	inputSize?: Size;
};

export const inputDisabledStyles = ( disabled?: boolean ) => {
	if ( ! disabled ) return '';

	return css( {
		color: COLORS.ui.textDisabled,
	} );
};

export const fontSizeStyles = ( { inputSize: size }: InputSizeProps ) => {
	const sizes = {
		default: '13px',
		small: '11px',
		compact: '13px',
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
	__next40pxDefaultSize,
}: InputSizeProps ) => {
	// Paddings may be overridden by the custom paddings props.
	const sizes = {
		default: {
			height: 40,
			lineHeight: 1,
			minHeight: 40,
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
		compact: {
			height: 32,
			lineHeight: 1,
			minHeight: 32,
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

	if ( ! __next40pxDefaultSize ) {
		sizes.default = sizes.compact;
	}

	return sizes[ size as Size ] || sizes.default;
};

export const inputSizeStyles = (
	props: Parameters< typeof getSizeConfig >[ 0 ]
) => {
	return css( getSizeConfig( props ) );
};

export const inputCustomPaddings = ( {
	hasPrefix,
	hasSuffix,
}: {
	hasPrefix: boolean;
	hasSuffix: boolean;
} ) => {
	return css( {
		paddingInlineStart: hasPrefix ? space( 2 ) : undefined,
		paddingInlineEnd: hasSuffix ? space( 2 ) : undefined,
	} );
};

export const inputDragStyles = ( {
	isDragging,
	dragCursor,
}: {
	isDragging?: boolean;
	dragCursor?: CSSProperties[ 'cursor' ];
} ) => {
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
export const input = css`
	&&& {
		background-color: transparent;
		box-sizing: border-box;
		border: none;
		box-shadow: none !important;
		color: ${ COLORS.theme.foreground };
		display: block;
		font-family: inherit;
		margin: 0;
		outline: none;
		width: 100%;

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
	isBorderless?: boolean;
	isFocused?: boolean;
};

const backdropFocusedStyles = ( {
	disabled,
	isBorderless,
	isFocused,
}: BackdropProps ): SerializedStyles => {
	let borderColor = isBorderless ? 'transparent' : COLORS.ui.border;

	let boxShadow;
	let outline;
	let outlineOffset;

	if ( isFocused ) {
		borderColor = COLORS.ui.borderFocus;
		boxShadow = CONFIG.controlBoxShadowFocus;
		// Windows High Contrast mode will show this outline, but not the box-shadow.
		outline = `2px solid transparent`;
		outlineOffset = `-2px`;
	}

	if ( disabled ) {
		borderColor = isBorderless ? 'transparent' : COLORS.ui.borderDisabled;
	}

	return css( {
		boxShadow,
		borderColor,
		borderStyle: 'solid',
		borderWidth: 1,
		outline,
		outlineOffset,
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
		padding-inline-start: 2px;
		pointer-events: none;
		position: absolute;
		right: 0;
		top: 0;

		${ backdropFocusedStyles }
	}
`;

export const prefix = css`
	box-sizing: border-box;
	display: block;
`;

export const suffix = css`
	align-items: center;
	align-self: stretch;
	box-sizing: border-box;
	display: flex;
`;
