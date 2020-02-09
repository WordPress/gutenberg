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
import { Button as PrimitiveButton, A } from '../styled-primitives/button';
import additionalStylesHelper from '../styled-primitives/additionalStylesHelper';

import styles from './styles';

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
	additionalStyles,
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
			css={ ( theme ) => [
				styles.base( theme ),
				( isDefault || isSecondary ) && styles.secondary( theme ),
				isPrimary && styles.primary( theme ),
				isTertiary && styles.tertiary( theme ),
				isLink && styles.link( theme ),
				isSmall && styles.small( theme ),
				!! icon && styles.hasIcon( theme ),
				isBusy && styles.busy( theme ),
				additionalStyles && additionalStylesHelper( additionalStyles ),
			]
			}
			font-size={ isSmall ? 'small' : 'default' }
			aria-label={ additionalProps[ 'aria-label' ] || label }
			{ ...propsToPass }
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
