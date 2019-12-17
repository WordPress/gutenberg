/**
 * External dependencies
 */
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

export function Button( props, ref ) {
	const {
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
		tooltip,
		tooltipPosition,
		shortcut,
		label,
		children,
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
		'is-large': isLarge,
		'is-small': isSmall,
		'is-tertiary': isTertiary,
		'is-pressed': isPressed,
		'is-busy': isBusy,
		'is-link': isLink,
		'is-destructive': isDestructive,
		'has-text': !! icon && !! children,
		// Ideally should be has-icon but this is named this way for BC
		'components-icon-button': !! icon,
	} );

	const Tag = href !== undefined && ! disabled ? 'a' : 'button';
	const tagProps = Tag === 'a' ?
		{ href, target } :
		{ type: 'button', disabled, 'aria-pressed': isPressed };

	// Should show the tooltip if...
	const showTooltip = ! disabled && (
		// an explicit tooltip is passed or...
		tooltip ||
		// there's a shortcut or...
		shortcut ||
		(
			// there's a label and...
			!! label &&
			// the children are empty and...
			( ! children || ( isArray( children ) && ! children.length ) ) &&
			// the tooltip is not explicitly disabled.
			false !== tooltip
		)
	);

	const element = (
		<Tag
			{ ...tagProps }
			{ ...additionalProps }
			className={ classes }
			aria-label={ label }
			ref={ ref }
		>
			{ icon && <Icon icon={ icon } size={ iconSize } /> }
			{ children }
		</Tag>
	);

	if ( ! showTooltip ) {
		return element;
	}

	const tooltipText = tooltip || label;

	return (
		<Tooltip text={ tooltipText } shortcut={ shortcut } position={ tooltipPosition }>
			{ element }
		</Tooltip>
	);
}

export default forwardRef( Button );
