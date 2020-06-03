/**
 * External dependencies
 */
import { css } from '@emotion/core';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { color, reduceMotion, rtl } from '../../utils/style-mixins';

const rangeHeight = () => css( { height: 30, minHeight: 30 } );

export const Root = styled.span`
	-webkit-tap-highlight-color: transparent;
	box-sizing: border-box;
	cursor: pointer;
	align-items: flex-start;
	display: inline-flex;
	justify-content: flex-start;
	padding: 0;
	position: relative;
	touch-action: none;
	width: 100%;
`;

const wrapperColor = ( {
	color: colorProp = color( 'blue.medium.focus' ),
} ) => {
	return css( { color: colorProp } );
};
const wrapperMargin = ( { marks } ) =>
	css( { marginBottom: marks ? 16 : null } );

export const Wrapper = styled.span`
	box-sizing: border-box;
	display: block;
	padding-top: 15px;
	position: relative;
	width: 100%;

	${ wrapperColor };
	${ rangeHeight };
	${ wrapperMargin };

	${ rtl( { marginLeft: 10 } ) }
`;

export const BeforeIconWrapper = styled.span`
	margin-top: 3px;

	${ rtl( { marginRight: 6 } ) }
`;

export const AfterIconWrapper = styled.span`
	margin-top: 3px;

	${ rtl( { marginLeft: 16 } ) }
`;

const railBackgroundColor = ( { disabled, railColor } ) => {
	let background = railColor || null;

	if ( disabled ) {
		background = color( 'lightGray.400' );
	}

	return css( {
		background,
	} );
};

export const Rail = styled.span`
	background-color: ${ color( 'lightGray.600' ) };
	box-sizing: border-box;
	left: 0;
	pointer-events: none;
	right: 0;
	display: block;
	height: 3px;
	position: absolute;
	margin-top: 14px;
	top: 0;

	${ railBackgroundColor };
`;

const trackBackgroundColor = ( { disabled, trackColor } ) => {
	let background = trackColor || 'currentColor';

	if ( disabled ) {
		background = color( 'lightGray.800' );
	}

	return css( {
		background,
	} );
};

export const Track = styled.span`
	background-color: currentColor;
	border-radius: 1px;
	box-sizing: border-box;
	height: 3px;
	pointer-events: none;
	display: block;
	position: absolute;
	margin-top: 14px;
	top: 0;

	${ trackBackgroundColor };
`;

export const MarksWrapper = styled.span`
	box-sizing: border-box;
	display: block;
	position: relative;
	width: 100%;
	user-select: none;
`;

const markFill = ( { disabled, isFilled } ) => {
	let backgroundColor = isFilled ? 'currentColor' : color( 'lightGray.600' );

	if ( disabled ) {
		backgroundColor = color( 'lightGray.800' );
	}

	return css( {
		backgroundColor,
	} );
};

export const Mark = styled.span`
	box-sizing: border-box;
	height: 9px;
	left: 0;
	position: absolute;
	top: -4px;
	width: 1px;

	${ markFill };
`;

const markLabelFill = ( { isFilled } ) => {
	return css( {
		color: isFilled ? color( 'darkGray.300' ) : color( 'lightGray.600' ),
	} );
};

export const MarkLabel = styled.span`
	box-sizing: border-box;
	color: ${ color( 'lightGray.600' ) };
	left: 0;
	font-size: 11px;
	position: absolute;
	top: 12px;
	transform: translateX( -50% );
	white-space: nowrap;

	${ markLabelFill };
`;

export const ThumbWrapper = styled.span`
	align-items: center;
	box-sizing: border-box;
	display: flex;
	height: 20px;
	justify-content: center;
	margin-top: 5px;
	outline: 0;
	pointer-events: none;
	position: absolute;
	top: 0;
	user-select: none;
	width: 20px;

	${ rtl( { marginLeft: -10 } ) }
`;

const thumbFocus = ( { isFocused } ) => {
	return css( {
		borderColor: isFocused
			? color( 'blue.medium.focus' )
			: color( 'darkGray.200' ),
		boxShadow: isFocused
			? `
				0 0 0 1px ${ color( 'blue.medium.focus' ) }
			`
			: `
				0 0 0 rgba(0, 0, 0, 0)
			`,
	} );
};

export const Thumb = styled.span`
	align-items: center;
	background-color: white;
	border-radius: 50%;
	border: 1px solid ${ color( 'darkGray.200' ) };
	box-sizing: border-box;
	height: 100%;
	outline: 0;
	pointer-events: none;
	position: absolute;
	user-select: none;
	width: 100%;

	${ thumbFocus };
`;

export const InputRange = styled.input`
	box-sizing: border-box;
	cursor: pointer;
	display: block;
	height: 100%;
	left: 0;
	margin: 0;
	opacity: 0;
	outline: none;
	position: absolute;
	right: 0;
	top: 0;
	width: 100%;
`;

const tooltipShow = ( { show } ) => {
	return css( {
		opacity: show ? 1 : 0,
	} );
};

const tooltipPosition = ( { position } ) => {
	const isTop = position === 'top';

	if ( isTop ) {
		return css`
			margin-top: -4px;
			top: -100%;

			&::after {
				border-bottom: none;
				border-top-style: solid;
				bottom: -6px;
			}
		`;
	}

	return css`
		margin-bottom: -4px;
		bottom: -100%;

		&::after {
			border-bottom-style: solid;
			border-top: none;
			top: -6px;
		}
	`;
};

export const Tooltip = styled.span`
	background: ${ color( 'darkGray.800' ) };
	border-radius: 3px;
	box-sizing: border-box;
	color: white;
	display: inline-block;
	font-size: 11px;
	min-width: 32px;
	opacity: 0;
	padding: 8px;
	pointer-events: none;
	position: absolute;
	text-align: center;
	transition: opacity 120ms ease;
	user-select: none;

	&::after {
		border: 6px solid ${ color( 'darkGray.800' ) };
		border-left-color: transparent;
		border-right-color: transparent;
		bottom: -6px;
		box-sizing: border-box;
		content: '';
		height: 0;
		left: 50%;
		line-height: 0;
		margin-left: -6px;
		position: absolute;
		width: 0;
	}

	${ tooltipShow };
	${ tooltipPosition };
	${ reduceMotion( 'transition' ) };
	${ rtl(
		{ transform: 'translateX(-50%)' },
		{ transform: 'translateX(50%)' }
	) }
`;

export const InputNumber = styled.input`
	box-sizing: border-box;
	display: inline-block;
	margin-top: 0;
	min-width: 54px;
	max-width: 120px;

	input[type='number']& {
		${ rangeHeight };
	}

	${ rtl( { marginLeft: 16 } ) }
`;

export const ActionRightWrapper = styled.span`
	box-sizing: border-box;
	display: block;
	margin-top: 0;

	button,
	button.is-small {
		margin-left: 0;
		${ rangeHeight };
	}

	${ rtl( { marginLeft: 8 } ) }
`;
