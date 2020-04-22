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

export const Root = styled.div`
	box-sizing: border-box;
	position: relative;
	border-radius: 2px;
	${rootFloatLabelStyles};
`;

const containerBorder = ( { isFocused } ) => {
	const borderRadius = isFocused ? 3 : 2;

	return css( { borderRadius } );
};

export const Container = styled.div`
	align-items: center;
	background-color: ${color( 'white' )};
	box-sizing: border-box;
	display: flex;
	position: relative;
	${containerBorder};
`;

const fontSizeStyles = ( { size } ) => {
	const sizes = {
		default: '13px',
		small: '11px',
	};

	const fontSize = sizes[ size ];
	const fontSizeMobile = '16px';

	if ( ! fontSize ) return '';

	return css`
		font-size: ${fontSizeMobile};

		@media ( min-width: 600px ) {
			font-size: ${fontSize};
		}
	`;
};

const sizeStyles = ( { size } ) => {
	const sizes = {
		default: {
			height: 30,
			lineHeight: 30,
			minHeight: 30,
		},
		small: {
			height: 24,
			lineHeight: 24,
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
			opacity: ${opacity};
		}
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
		color: ${color( 'black' )};
		display: block;
		outline: none;
		padding-left: 8px;
		padding-right: 8px;
		width: 100%;

		${fontSizeStyles};
		${sizeStyles};

		${placeholderStyles};
	}
`;

const laberColor = ( { isFloatingLabel, isFilled, isFloating } ) => {
	const isPlaceholder = isFloatingLabel && ! isFilled;
	const textColor =
		isPlaceholder || isFloating ? color( 'lightGray.900' ) : 'currentColor';

	return css( { color: textColor } );
};

const labelFontSize = ( { isFloatingLabel, size } ) => {
	const sizes = {
		default: '13px',
		small: '11px',
	};
	const fontSize = sizes[ size ];
	const lineHeight = isFloatingLabel ? 1 : null;

	return css( { fontSize, lineHeight } );
};

const labelPosition = ( { isFloatingLabel, isFloating, size } ) => {
	const paddingBottom = isFloatingLabel ? 0 : 4;
	const position = isFloatingLabel ? 'absolute' : null;
	const pointerEvents = isFloating ? null : 'none';

	const marginTop = isFloating ? 0 : 1;
	const marginLeft = isFloatingLabel ? 8 : 0;
	const offset = size === 'small' ? '-3px' : '-5px';

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

const BaseLabel = styled( Text )`
	&&& {
		box-sizing: border-box;
		display: block;
		margin: 0;
		padding: 0;
		pointer-events: none;
		top: 50%;
		transition: transform ${FLOATING_LABEL_TRANSITION_SPEED} linear;
		z-index: 1;

		${laberColor};
		${labelFontSize};
		${labelPosition};
		${reduceMotion( 'transition' )};

		${rtl( { left: 0 } )}
	}
`;

export const Label = ( props ) => <BaseLabel { ...props } as="label" />;

const fieldsetTopStyles = ( { isFloatingLabel } ) => {
	const top = isFloatingLabel ? -5 : 0;
	return css( { top } );
};

const fieldsetFocusedStyles = ( { isFocused } ) => {
	const borderColor = isFocused
		? color( 'ui.borderFocus' )
		: color( 'ui.border' );

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

		${fieldsetFocusedStyles};
		${fieldsetTopStyles};
		${rtl( { paddingLeft: 2 } )}
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
		transition: max-width ${FLOATING_LABEL_TRANSITION_SPEED} linear;
		visibility: hidden;
		width: auto;

		${legendSize};
		${reduceMotion( 'transition' )};
	}
`;

const BaseLegendText = styled( Text )`
	box-sizing: border-box;
	display: inline-block;
	${rtl( { paddingLeft: 4, paddingRight: 5 } )}
`;

export const LegendText = ( props ) => (
	<BaseLegendText { ...props } as="span" />
);

export const Suffix = styled.span`
	box-sizing: border-box;
	display: block;
`;
