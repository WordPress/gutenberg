/**
 * External dependencies
 */
import { css } from '@emotion/core';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import Text from '../../text';
import { color, rtl, reduceMotion } from '../../utils/style-mixins';

const FLOATING_LABEL_TRANSITION_SPEED = '60ms';

const rootFloatLabelStyles = ( { isFloatingLabel } ) => {
	const paddingTop = isFloatingLabel ? 5 : 0;
	return css( { paddingTop } );
};

const rootFocusedStyles = ( { isFocused } ) => {
	if ( ! isFocused ) return '';

	return css( { zIndex: 1 } );
};

export const Root = styled.div`
	box-sizing: border-box;
	position: relative;
	border-radius: 2px;

	${ rootFloatLabelStyles };
	${ rootFocusedStyles };
`;

const containerDisabledStyle = ( { disabled } ) => {
	const backgroundColor = disabled
		? color( 'ui.backgroundDisabled' )
		: color( 'ui.background' );

	return css( { backgroundColor } );
};

export const Container = styled.div`
	align-items: center;
	box-sizing: border-box;
	border-radius: inherit;
	display: flex;
	position: relative;

	${ containerDisabledStyle };
`;

const disabledStyles = ( { disabled } ) => {
	if ( ! disabled ) return '';

	return css( {
		color: color( 'ui.textDisabled' ),
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

const placeholderStyles = ( { isFilled, isFloating, isFloatingLabel } ) => {
	let opacity = 1;

	if ( isFloatingLabel ) {
		if ( ! isFilled && ! isFloating ) {
			opacity = 0;
		}
	}

	return css`
		&::placeholder {
			opacity: ${ opacity };
		}

		&::-webkit-input-placeholder {
			line-height: normal;
		}
	`;
};

const dragStyles = ( { isDragging, dragCursor } ) => {
	let defaultArrowStyles = '';
	let activeDragCursorStyles = '';

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
		${ defaultArrowStyles };
		${ activeDragCursorStyles };
	`;
};

// TODO: Resolve need to use &&& to increase specificity
// https://github.com/WordPress/gutenberg/issues/18483

export const Input = styled.input`
	&&& {
		background-color: transparent;
		box-sizing: border-box;
		border: none;
		box-shadow: none !important;
		color: ${ color( 'black' ) };
		display: block;
		outline: none;
		padding-left: 8px;
		padding-right: 8px;
		width: 100%;

		${ dragStyles };
		${ disabledStyles };
		${ fontSizeStyles };
		${ sizeStyles };

		${ placeholderStyles };
	}
`;

const laberColor = ( { isFloatingLabel, isFilled, isFloating } ) => {
	const isPlaceholder = isFloatingLabel && ! isFilled;
	const textColor =
		isPlaceholder || isFloating
			? color( 'ui.textDisabled' )
			: 'currentColor';

	return css( { color: textColor } );
};

const labelFontSize = ( { isFloatingLabel, size } ) => {
	const sizes = {
		default: '13px',
		small: '11px',
	};
	const fontSize = sizes[ size ];
	const lineHeight = isFloatingLabel ? 1.2 : null;

	return css( { fontSize, lineHeight } );
};

const labelPosition = ( { isFloatingLabel, isFloating, size } ) => {
	const paddingBottom = isFloatingLabel ? 0 : 4;
	const position = isFloatingLabel ? 'absolute' : null;
	const pointerEvents = isFloating ? null : 'none';

	const isSmall = size === 'small';

	const offsetTop = isSmall ? 1 : 2;
	const offset = isSmall ? '-1px' : '-3px';

	const marginTop = isFloating ? 0 : offsetTop;
	const marginLeft = isFloatingLabel ? 8 : 0;

	let transform = isFloating
		? `translate( 0, calc(-100% + ${ offset }) ) scale( 0.75 )`
		: 'translate( 0, -50%) scale(1)';

	if ( ! isFloatingLabel ) {
		transform = null;
	}

	const transition = isFloatingLabel
		? `transform ${ FLOATING_LABEL_TRANSITION_SPEED } linear`
		: null;

	return css(
		{
			marginTop,
			paddingBottom,
			position,
			pointerEvents,
			transition,
			transform,
		},
		rtl( { marginLeft } )(),
		rtl(
			{ transformOrigin: 'top left' },
			{ transformOrigin: 'top right' }
		)()
	);
};

const labelTruncation = ( { isFloating } ) => {
	if ( isFloating ) return '';

	return css`
		max-width: calc( 100% - 10px );
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	`;
};

const BaseLabel = styled( Text )`
	&&& {
		box-sizing: border-box;
		display: block;
		margin: 0;
		max-width: 100%;
		padding: 0;
		pointer-events: none;
		top: 50%;
		transition: transform ${ FLOATING_LABEL_TRANSITION_SPEED } linear,
			max-width ${ FLOATING_LABEL_TRANSITION_SPEED } linear;
		z-index: 1;

		${ laberColor };
		${ labelFontSize };
		${ labelPosition };
		${ labelTruncation };
		${ reduceMotion( 'transition' ) };

		${ rtl( { left: 0 } ) }
	}
`;

export const Label = ( props ) => <BaseLabel { ...props } as="label" />;

const fieldsetTopStyles = ( { isFloatingLabel } ) => {
	const top = isFloatingLabel ? -5 : 0;
	return css( { top } );
};

const fieldsetFocusedStyles = ( { disabled, isFocused } ) => {
	let borderColor = isFocused
		? color( 'ui.borderFocus' )
		: color( 'ui.border' );

	if ( disabled ) {
		borderColor = 'ui.borderDisabled';
	}

	const borderWidth = isFocused ? 2 : 1;
	const borderStyle = 'solid';

	return css( { borderColor, borderStyle, borderWidth } );
};

export const Fieldset = styled.fieldset`
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

		${ fieldsetFocusedStyles };
		${ fieldsetTopStyles };
		${ rtl( { paddingLeft: 2 } ) }
	}
`;

const legendSize = ( { isFloating, size } ) => {
	const maxWidth = isFloating ? 1000 : 0.01;
	const sizes = {
		default: 9.75,
		small: 8.25,
	};

	const fontSize = sizes[ size ];

	return css( {
		fontSize,
		maxWidth,
	} );
};

export const Legend = styled.legend`
	&&& {
		box-sizing: border-box;
		display: block;
		height: 11px;
		line-height: 11px;
		margin: 0;
		padding: 0;
		transition: max-width ${ FLOATING_LABEL_TRANSITION_SPEED } linear;
		visibility: hidden;
		width: auto;

		${ legendSize };
		${ reduceMotion( 'transition' ) };
	}
`;

const BaseLegendText = styled( Text )`
	box-sizing: border-box;
	display: inline-block;
	${ rtl( { paddingLeft: 4, paddingRight: 5 } ) }
`;

export const LegendText = ( props ) => (
	<BaseLegendText { ...props } as="span" />
);

export const Suffix = styled.span`
	box-sizing: border-box;
	display: block;
`;
