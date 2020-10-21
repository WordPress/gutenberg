/* eslint-disable jsdoc/check-tag-names */
/** @jsx jsx */
/* eslint-enable jsdoc/check-tag-names */
/**
 * External dependencies
 */
import { jsx, css } from '@emotion/core';
import classnames from 'classnames';
import { isArray } from 'lodash';

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
import * as buttonStyles from './styles';

const disabledEventsOnDisabledButton = [ 'onMouseDown', 'onClick' ];

const getBaseStyles = ( props ) => {
	if ( props.isPrimary ) {
		return buttonStyles.primary.styles;
	}

	if ( props.isSecondary ) {
		return buttonStyles.secondary.styles;
	}

	if ( props.isTertiary ) {
		return buttonStyles.tertiary.styles;
	}

	if ( props.isLink ) {
		if ( props.isDestructive ) {
			return css`
				${ buttonStyles.link.styles }
				${ buttonStyles.link.destructive }
			`;
		}
		return buttonStyles.link.styles;
	}

	// check pure destructive last to allow for destructive links
	if ( props.isDestructive ) {
		return buttonStyles.destructive.styles;
	}

	return buttonStyles.shared.buttonBase;
};

const getBusyStyles = ( props ) => {
	if ( ! props.isBusy ) {
		return '';
	}

	if ( props.isPrimary ) {
		return buttonStyles.busy.primary;
	}

	return buttonStyles.busy.generic;
};

const getPressedStyles = ( props ) => {
	if ( props.isPressed ) {
		return buttonStyles.shared.pressed;
	}

	return '';
};

const getSmallStyles = ( props, hasIcon, hasText ) => {
	if ( props.isSmall ) {
		if ( hasIcon && ! hasText ) {
			return buttonStyles.shared.smallOnlyIcon;
		}

		return buttonStyles.shared.small;
	}

	return '';
};

const getIconStyles = ( hasIcon, hasText ) => {
	if ( hasIcon ) {
		if ( hasText ) {
			return buttonStyles.shared.iconWithText;
		}

		return buttonStyles.shared.icon;
	}

	return '';
};

export function Button( props, ref ) {
	const {
		href,
		target,
		isPrimary,
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
		__experimentalIsFocusable: isFocusable,
		...additionalProps
	} = props;

	if ( isDefault ) {
		deprecated( 'Button isDefault prop', {
			alternative: 'isSecondary',
		} );
	}

	const classes = classnames( 'components-button', className, {
		'is-secondary': isDefault || isSecondary,
		'is-primary': isPrimary,
		'is-small': isSmall,
		'is-tertiary': isTertiary,
		'is-pressed': isPressed,
		'is-busy': isBusy,
		'is-link': isLink,
		'is-destructive': isDestructive,
		'has-text': !! icon && !! children,
		'has-icon': !! icon,
	} );

	const hasText = !! icon && !! children;
	const hasIcon = !! icon;

	const trulyDisabled = disabled && ! isFocusable;
	const Tag = href !== undefined && ! trulyDisabled ? 'a' : 'button';
	const tagProps =
		Tag === 'a'
			? { href, target }
			: {
					type: 'button',
					disabled: trulyDisabled,
					'aria-pressed': isPressed,
			  };

	if ( disabled && isFocusable ) {
		// In this case, the button will be disabled, but still focusable and
		// perceivable by screen reader users.
		tagProps[ 'aria-disabled' ] = true;

		for ( const disabledEvent of disabledEventsOnDisabledButton ) {
			additionalProps[ disabledEvent ] = ( event ) => {
				event.stopPropagation();
				event.preventDefault();
			};
		}
	}

	// Should show the tooltip if...
	const shouldShowTooltip =
		! trulyDisabled &&
		// an explicit tooltip is passed or...
		( ( showTooltip && label ) ||
			// there's a shortcut or...
			shortcut ||
			// there's a label and...
			( !! label &&
				// the children are empty and...
				( ! children ||
					( isArray( children ) && ! children.length ) ) &&
				// the tooltip is not explicitly disabled.
				false !== showTooltip ) );

	const element = (
		<Tag
			css={ css`
				${ getBaseStyles( props ) }
				${ getBusyStyles( props ) }
				${ getSmallStyles( props, hasIcon, hasText ) }
				${ getPressedStyles( props ) }
				${ getIconStyles( hasIcon, hasText ) }
			` }
			{ ...tagProps }
			{ ...additionalProps }
			className={ classes }
			aria-label={ additionalProps[ 'aria-label' ] || label }
			ref={ ref }
		>
			{ icon && <Icon icon={ icon } size={ iconSize } /> }
			{ children }
		</Tag>
	);

	if ( ! shouldShowTooltip ) {
		return element;
	}

	return (
		<Tooltip
			text={ label }
			shortcut={ shortcut }
			position={ tooltipPosition }
		>
			{ element }
		</Tooltip>
	);
}

export default forwardRef( Button );
