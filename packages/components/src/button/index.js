/**
 * External dependencies
 */
import classnames from 'classnames';
import { isArray } from 'lodash';
import { css } from '@emotion/core';

/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Tooltip from '../tooltip';
import Icon from '../icon';
import { Button as PrimitiveButton, A } from '../styled-primitives/button';

const styles = css`
	border: 0;
	cursor: pointer;
	-webkit-appearance: none;
	background: none;
	transition: box-shadow 0.1s linear;
	display: inline-flex;
	text-decoration: none;
	margin: 0;
	align-items: center;
	box-sizing: border-box;
	overflow: hidden;
	padding: 0 8px;
	border-radius: 3px;

	&.is-secondary {
		border-style: solid;
		white-space: nowrap;
		background: #f3f5f6;

		&:not(:disabled):not([aria-disabled="true"]):hover {
			background: #f1f1f1;
			text-decoration: none;
		}

		&:focus:enabled {
			background: #f3f5f6;
			text-decoration: none;
		}

		&:active:enabled {
			background: #f3f5f6;
			border-color: #7e8993;
			box-shadow: none;
		}

		&:disabled,
		&[aria-disabled="true"] {
			color: #a0a5aa;
			border-color: #ddd;
			background: #f7f7f7;
			transform: none;
			opacity: 1;
		}
	}

	&.is-primary {
		border-style: solid;
		white-space: nowrap;
		text-shadow: none;

		&:not(:disabled):not([aria-disabled="true"]):hover,
		&:focus:enabled {
			color: white;
		}

		&:active:enabled {
			color: white;
		}

		&:disabled,
		&:disabled:active:enabled,
		&[aria-disabled="true"],
		&[aria-disabled="true"]:enabled,
		&[aria-disabled="true"]:active:enabled {
			opacity: 1;
		}

		&.is-busy,
		&.is-busy:disabled,
		&.is-busy[aria-disabled="true"] {
			color: white;
			background-size: 100px 100%;
		}
	}

	&.is-link {
		box-shadow: none;
		border: 0;
		background: none;
		outline: none;
		text-align: left;
		color: #0073aa;
		transition-property: border, background, color;
		transition-duration: 0.05s;
		transition-timing-function: ease-in-out;
		height: auto;
		text-decoration: underline;
		padding: 0;
		border-radius: 0;

		&:not(:disabled):not([aria-disabled="true"]):hover,
		&:active {
			color: #00a0d2;
		}

		&:focus {
			color: #124964;
		}
	}

	&:active {
		color: inherit;
	}

	&:disabled,
	&[aria-disabled="true"] {
		cursor: default;
		opacity: 0.3;
	}

	&.is-busy,
	&.is-secondary.is-busy,
	&.is-secondary.is-busy:disabled,
	&.is-secondary.is-busy[aria-disabled="true"] {
		background-size: 100px 100%;
		opacity: 1;
	}

	&.is-small {
		height: 24px;
		line-height: 22px;
	}

	&.is-tertiary {

		.dashicon {
			display: inline-block;
			flex: 0 0 auto;
		}

		svg {
			fill: currentColor;
			outline: none;
		}

		&:active:focus:enabled {
			box-shadow: none;
		}
	}

	&.has-icon {
		.dashicon {
			display: inline-block;
			flex: 0 0 auto;
		}

		svg {
			fill: currentColor;
			outline: none;
		}

		&.has-text svg {
			margin-right: 8px;
		}
	}

	.screen-reader-text {
		height: auto;
	}

@keyframes components-button__busy-animation {
	0% {
		background-position: 200px 0;
	}
}
`;

export function Button( {
	href,
	target,
	isPrimary,
	isLarge,
	isSmall,
	isTertiary,
	isPressed,
	isBusy,
	isDefault,
	isSecondary,
	isLink,
	isDestructive,
	className,
	disabled,
	icon,
	iconSize,
	showTooltip,
	tooltipPosition,
	shortcut,
	label,
	children,
	...additionalProps
}, ref ) {
	if ( isDefault ) {
		deprecated( 'Button isDefault prop', {
			alternative: 'isSecondary',
		} );
	}

	const classes = classnames( 'components-button', className, {
		'is-secondary': isDefault || isSecondary,
		'is-primary': isPrimary,
		'is-large': isLarge,
		'is-small': isSmall,
		'is-tertiary': isTertiary,
		'is-pressed': isPressed,
		'is-busy': isBusy,
		'is-link': isLink,
		'is-destructive': isDestructive,
		'has-text': !! icon && !! children,
		'has-icon': !! icon,
	} );

	const Tag = href !== undefined && ! disabled ? A : PrimitiveButton;
	const tagProps = Tag === A ?
		{ href, target } :
		{ type: 'button', disabled, 'aria-pressed': isPressed };
	const propsToPass = { ...tagProps, ...additionalProps, className: classes, ref };

	// Should show the tooltip if...
	const shouldShowTooltip = ! disabled && (
		// an explicit tooltip is passed or...
		( showTooltip && label ) ||
		// there's a shortcut or...
		shortcut ||
		(
			// there's a label and...
			!! label &&
			// the children are empty and...
			( ! children || ( isArray( children ) && ! children.length ) ) &&
			// the tooltip is not explicitly disabled.
			false !== showTooltip
		)
	);

	const element = (
		<Tag
			css={ styles }
			font-size={ isSmall ? 'small' : 'default' }
			{ ...propsToPass }
			aria-label={ additionalProps[ 'aria-label' ] || label }
		>
			{ icon && <Icon icon={ icon } size={ iconSize } /> }
			{ children }
		</Tag>
	);

	if ( ! shouldShowTooltip ) {
		return element;
	}

	return (
		<Tooltip text={ label } shortcut={ shortcut } position={ tooltipPosition }>
			{ element }
		</Tooltip>
	);
}

export default forwardRef( Button );
