/**
 * External dependencies
 */
import { css } from '@emotion/core';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { color, rtl, reduceMotion } from '../../utils/style-mixins';

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
	box-sizing: border-box;
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
		box-sizing: border-box;
		border: none !important;
		box-shadow: none !important;
		display: block;
		outline: none;
		padding-left: 8px !important;
		padding-right: 8px !important;
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

const labelFontSize = ( { size } ) => {
	const sizes = {
		default: '13px',
		small: '11px',
	};
	const fontSize = sizes[ size ];

	return css( { fontSize } );
};

const labelPosition = ( { isFloatingLabel, isFloating, size } ) => {
	const paddingBottom = isFloatingLabel ? 0 : 4;
	const position = isFloatingLabel ? 'absolute' : null;
	const pointerEvents = isFloating ? null : 'none';

	const marginTop = isFloating ? 0 : 2;
	const offset = size === 'small' ? '-2px' : '-5px';

	let transform = isFloating
		? `translate( 0, calc(-100% + ${ offset }) ) scale( 0.75 )`
		: 'translate( 0, -50%) scale(1)';

	if ( ! isFloatingLabel ) {
		transform = null;
	}

	const transition = isFloatingLabel ? 'transform 50ms linear' : null;

	return css(
		{
			marginTop,
			paddingBottom,
			position,
			pointerEvents,
			transition,
			transform,
		},
		rtl( { marginLeft: 8 } )(),
		rtl(
			{ transformOrigin: 'top left' },
			{ transformOrigin: 'top right' }
		)()
	);
};

export const Label = styled.label`
	box-sizing: border-box;
	display: block;
	top: 50%;
	transition: transform 50ms linear;
	z-index: 1;

	${laberColor};
	${labelFontSize};
	${labelPosition};
	${reduceMotion( 'transition' )};

	${rtl( { left: 0 } )}
`;

const fieldsetTopStyles = ( { isFloatingLabel } ) => {
	const top = isFloatingLabel ? -5 : 0;
	return css( { top } );
};

const fieldsetFocusedStyles = ( { isFocused } ) => {
	const borderColor = isFocused
		? color( 'ui.borderFocus' )
		: color( 'ui.border' );

	const borderWidth = isFocused ? 2 : 1;

	return css( { borderColor, borderWidth } );
};

export const Fieldset = styled.fieldset`
	box-sizing: border-box;
	border-color: black;
	border-radius: inherit;
	border-style: solid;
	border-width: 1px;
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
`;

const legendWidth = ( { isFloating } ) => {
	const maxWidth = isFloating ? 1000 : 0.01;
	return css( {
		maxWidth,
	} );
};

export const Legend = styled.legend`
	box-sizing: border-box;
	width: auto;
	height: 11px;
	display: block;
	padding: 0;
	font-size: 0.75em;
	transition: max-width 50ms linear;
	visibility: hidden;

	${legendWidth};
	${reduceMotion( 'transition' )};
`;

export const LegendText = styled.span`
	box-sizing: border-box;
	display: inline-block;
	padding-left: 4px;
	padding-right: 4px;
`;
