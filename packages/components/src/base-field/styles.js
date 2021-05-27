/**
 * External dependencies
 */
import { css } from 'emotion';

/**
 * Internal dependencies
 */
import { CONFIG, COLORS, reduceMotion } from '../utils';
import { safariOnly } from '../utils/browsers';

export const BaseField = css`
	background: ${ CONFIG.controlBackgroundColor };
	border-radius: ${ CONFIG.controlBorderRadius };
	border: 1px solid;
	border-color: ${ CONFIG.controlBorderColor };
	box-shadow: ${ CONFIG.controlBoxShadow };
	display: flex;
	flex: 1;
	font-size: ${ CONFIG.fontSize };
	outline: none;
	padding: 0 8px;
	position: relative;
	transition: border-color ${ CONFIG.transitionDurationFastest } ease;
	${ reduceMotion( 'transition' ) }
	width: 100%;

	&[disabled] {
		opacity: 0.6;
	}

	&:hover {
		border-color: ${ CONFIG.controlBorderColorHover };
	}

	&:focus,
	&[data-focused='true'] {
		border-color: ${ COLORS.admin.theme };
		box-shadow: ${ CONFIG.controlBoxShadowFocus };
	}
`;

export const clickable = css`
	cursor: pointer;
`;

export const focus = css`
	border-color: ${ COLORS.admin.theme };
	box-shadow: ${ CONFIG.controlBoxShadowFocus };

	&:hover {
		border-color: ${ COLORS.admin.theme };
	}
`;

export const subtle = css`
	background-color: transparent;

	&:hover,
	&:active,
	&:focus,
	&[data-focused='true'] {
		background: ${ CONFIG.controlBackgroundColor };
	}
`;

export const error = css`
	border-color: ${ CONFIG.controlDestructiveBorderColor };

	&:hover,
	&:active {
		border-color: ${ CONFIG.controlDestructiveBorderColor };
	}

	&:focus,
	&[data-focused='true'] {
		border-color: ${ CONFIG.controlDestructiveBorderColor };
		box-shadow: 0 0 0, 0.5px, ${ CONFIG.controlDestructiveBorderColor };
	}
`;

export const errorFocus = css`
	border-color: ${ CONFIG.controlDestructiveBorderColor };
	box-shadow: 0 0 0, 0.5px, ${ CONFIG.controlDestructiveBorderColor };

	&:hover {
		border-color: ${ CONFIG.controlDestructiveBorderColor };
	}
`;

export const inline = css`
	display: inline-flex;
	vertical-align: baseline;
	width: auto;

	${ safariOnly`
			vertical-align: middle;
	` }
`;
