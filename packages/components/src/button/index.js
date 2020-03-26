/**
 * External dependencies
 */
import classnames from 'classnames';
import { isArray } from 'lodash';

/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
import { forwardRef, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ButtonGroupContext } from '../button-group';
import Tooltip from '../tooltip';
import Icon from '../icon';

const disabledEventsOnDisabledButton = [ 'onMouseDown', 'onClick' ];

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
		showTooltip,
		tooltipPosition,
		shortcut,
		label,
		children,
		value,
		onKeyDown,
		onClick,
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

	const disabledEventProps = {};

	if ( disabled && isFocusable ) {
		// In this case, the button will be disabled, but still focusable and
		// perceivable by screen reader users.
		tagProps[ 'aria-disabled' ] = true;

		for ( const disabledEvent of disabledEventsOnDisabledButton ) {
			disabledEventProps[ disabledEvent ] = ( event ) => {
				event.stopPropagation();
				event.preventDefault();
			};
		}
	}

	const groupContext = useContext( ButtonGroupContext );
	const buttonContext = groupContext.buttons[ value ];
	const groupProps = {};

	if ( groupContext.mode === 'radio' && buttonContext ) {
		const {
			isChecked,
			isFirst,
			onPrev,
			onNext,
			onSelect,
			refCallback,
		} = buttonContext;

		Object.assign( groupProps, {
			role: groupContext.mode,
			'aria-checked': isChecked,
			tabIndex: isChecked || isFirst ? 0 : -1,
			// Pass through events and also handle the keyboard controls
			onKeyDown( e ) {
				if ( typeof onKeyDown === 'function' ) onKeyDown( e );
				if ( e.key === 'ArrowUp' || e.key === 'ArrowLeft' ) {
					e.preventDefault();
					onPrev();
				}
				if ( e.key === 'ArrowDown' || e.key === 'ArrowRight' ) {
					e.preventDefault();
					onNext();
				}
			},
			// May get overridden when disabled && isFocusable
			onClick( e ) {
				if ( typeof onClick === 'function' ) onClick( e );
				onSelect();
			},
			// Grab a ref for handling onPrev and onNext in the group, but also
			// pass through the ref from forwardRef
			ref: ( current ) => {
				refCallback( current );

				if ( typeof ref === 'function' ) {
					ref( current );
				} else if ( ref ) {
					ref.current = current;
				}
			},
			// Automatically handle the styling for the selected button
			className: classnames( classes, {
				'is-secondary': ! isChecked,
				'is-primary': isChecked,
			} ),
		} );
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
			ref={ ref }
			{ ...tagProps }
			{ ...additionalProps }
			className={ classes }
			aria-label={ additionalProps[ 'aria-label' ] || label }
			onKeyDown={ onKeyDown }
			onClick={ onClick }
			{ ...groupProps } // Overrides className, onKeyDown, and onClick
			{ ...disabledEventProps } // May override onMouseDown and/or onClick
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
