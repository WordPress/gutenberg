/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css } from '@emotion/core';

/**
 * Internal dependencies
 */
import { color, reduceMotion, rtl, zIndex, config } from '../../utils';
import {
	toggleBorderWidth,
	toggleWidth,
	toggleHeight,
	appearTransform,
} from './utils';

export const StyledToggleTrack = styled.span`
	content: '';
	display: inline-block;
	box-sizing: border-box;
	vertical-align: top;
	background-color: ${ color( 'white' ) };
	border: ${ toggleBorderWidth }px solid ${ color( 'darkGray.primary' ) };
	width: ${ toggleWidth }px;
	height: ${ toggleHeight }px;
	border-radius: ${ toggleHeight / 2 }px;
	transition: 0.2s background ease;
	${ reduceMotion( 'transition' ) }
`;

export const StyledToggleThumb = styled.span`
	display: block;
	position: absolute;
	box-sizing: border-box;
	top: ${ toggleBorderWidth * 3 }px;
	${ rtl( { left: `${ toggleBorderWidth * 3 }px` } ) };
	width: ${ toggleHeight - toggleBorderWidth * 6 }px;
	height: ${ toggleHeight - toggleBorderWidth * 6 }px;
	border-radius: 50%;
	transition: 0.1s transform ease;
	${ reduceMotion( 'transition' ) }
	background-color: ${ color( 'darkGray.primary' ) };
	border: 5px solid ${ color(
		'darkGray.primary'
	) }; // Has explicit border to act as a fill in Windows High Contrast Mode.
`;

export const StyledToggleInput = styled.input`
	&,
	&[type='checkbox'] {
		position: absolute;
		top: 0;
		${ rtl( { left: 0 } ) };
		width: 100%;
		height: 100%;
		opacity: 0;
		margin: 0;
		padding: 0;
		${ zIndex( 'StyledToggleInput' ) };

		// This overrides a border style that is inherited from parent checkbox styles.
		border: none;
		&:checked {
			background: none;
		}

		// Don't show custom checkbox checkmark.
		&::before {
			content: '';
		}
	}
`;

const checkedStyles = css`
	${ StyledToggleTrack } {
		background-color: var( --wp-admin-theme-color );
		border: ${ toggleBorderWidth }px solid var( --wp-admin-theme-color );
		border: ${ toggleHeight / 2 }px solid transparent; // Expand the border to fake a solid in Windows High Contrast Mode.
	}

	${ StyledToggleThumb } {
		background-color: ${ color( 'white' ) };
		border-width: 0; // Zero out the border color to make the thumb invisible in Windows High Contrast Mode.
		${ appearTransform() }
	}
`;

export const StyledFormToggle = styled.span`
	position: relative;
	display: inline-block;

	${ ( props ) => ( props.isChecked ? checkedStyles : '' ) }

	${ StyledToggleInput }:focus + ${ StyledToggleTrack } {
		box-shadow: 0 0 0 2px ${ color( 'white' ) },
			0 0 0 calc( 2px + ${ config(
				'borderWidthFocus'
			) } )) var( --wp-admin-theme-color );

		// Windows High Contrast mode will show this outline, but not the box-shadow.
		outline: 2px solid transparent;
		outline-offset: 2px;
	}

	.components-disabled & {
		opacity: 0.3;
	}
`;
