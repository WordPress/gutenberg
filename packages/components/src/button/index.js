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
import * as styledButtons from './styles';

const disabledEventsOnDisabledButton = [ 'onMouseDown', 'onClick' ];

const getStyledButton = ( props ) => {
	if ( props.isPrimary ) {
		return styledButtons.PrimaryButton;
	}

	if ( props.isSecondary ) {
		return styledButtons.SecondaryButton;
	}

	if ( props.isTertiary ) {
		return styledButtons.TertiaryButton;
	}

	if ( props.isLink ) {
		return styledButtons.LinkButton;
	}

	// check pure destructive last to allow for destructive links
	if ( props.isDestructive ) {
		return styledButtons.DestructiveButton;
	}

	return styledButtons.BaseButton;
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

	const hasIcon = !! icon;
	const hasText = !! icon && !! children;

	const classes = classnames( 'components-button', className, {
		'is-secondary': isDefault || isSecondary,
		'is-primary': isPrimary,
		'is-small': isSmall,
		'is-tertiary': isTertiary,
		'is-pressed': isPressed,
		'is-busy': isBusy,
		'is-link': isLink,
		'is-destructive': isDestructive,
		'has-text': hasText,
		'has-icon': hasIcon,
	} );

	const trulyDisabled = disabled && ! isFocusable;
	const StyledButton = getStyledButton( props );
	const tag = href !== undefined && ! trulyDisabled ? 'a' : 'button';
	const tagProps =
		tag === 'a'
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
		<StyledButton
			as={ tag }
			{ ...tagProps }
			{ ...additionalProps }
			className={ classes }
			aria-label={ additionalProps[ 'aria-label' ] || label }
			ref={ ref }
			isDestructive={ isDestructive }
			isSmall={ isSmall }
			isBusy={ isBusy }
			isPressed={ isPressed }
			hasText={ hasText }
			hasIcon={ hasIcon }
		>
			{ icon && <Icon icon={ icon } size={ iconSize } /> }
			{ children }
		</StyledButton>
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
