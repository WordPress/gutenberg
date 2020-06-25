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

const wrapperMargin = ( { marks } ) =>
	css( { marginBottom: marks ? 16 : null } );

export const Wrapper = styled.span`
	box-sizing: border-box;
	color: ${ color( 'blue.medium.focus' ) };
	display: block;
	padding-top: 15px;
	position: relative;
	width: 100%;

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

const disabledRailBackgroundColor = ( { disabled } ) => {
	if ( ! disabled ) return '';
	return css( {
		backgroundColor: color( 'lightGray.400' ),
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

	${ disabledRailBackgroundColor };
`;

const disabledBackgroundColor = ( { disabled } ) => {
	if ( ! disabled ) return '';
	return css( {
		backgroundColor: color( 'lightGray.800' ),
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

	${ disabledBackgroundColor };
`;

export const MarksWrapper = styled.span`
	box-sizing: border-box;
	display: block;
	position: relative;
	width: 100%;
	user-select: none;
`;

const markFill = ( { isFilled } ) => {
	return css( {
		backgroundColor: isFilled ? 'currentColor' : color( 'lightGray.600' ),
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
	${ disabledBackgroundColor };
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
			top: -80%;
		`;
	}

	return css`
		bottom: -80%;
	`;
};

export const Tooltip = styled.span`
	background: ${ color( 'ui.border' ) };
	border-radius: 2px;
	box-sizing: border-box;
	color: white;
	display: inline-block;
	font-size: 12px;
	min-width: 32px;
	opacity: 0;
	padding: 4px 8px;
	pointer-events: none;
	position: absolute;
	text-align: center;
	transition: opacity 120ms ease;
	user-select: none;
	line-height: 1.4;

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
	min-width: 60px;
	max-width: 120px;
	font-size: 13px;

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
