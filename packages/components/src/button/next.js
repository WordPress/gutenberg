/**
 * External dependencies
 */

const disabledEventsOnDisabledButton = [ 'onMouseDown', 'onClick' ];

export function buttonAdapter( props ) {
	const {
		href,
		target,
		isPrimary,
		isSmall,
		label,
		isTertiary,
		isPressed,
		isBusy,
		isDefault,
		isSecondary,
		isLink,
		isDestructive,
		disabled,
		icon,
		iconSize,
		// showTooltip,
		// tooltipPosition,
		// shortcut,
		__experimentalIsFocusable: isFocusable,
		...additionalProps
	} = props;

	let variant;
	let size;

	switch ( true ) {
		case isPrimary:
			variant = 'primary';
			break;
		case isSecondary:
			variant = 'secondary';
			break;
		case isDefault:
			variant = 'secondary';
			break;
		case isTertiary:
			variant = 'tertiary';
			break;
	}

	switch ( true ) {
		case isSmall:
			size = 'small';
			break;
	}

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

	return {
		...additionalProps,
		as: Tag,
		'aria-label': additionalProps[ 'aria-label' ] || label,
		variant,
		isLoading: isBusy,
		isDestructive,
		isLink,
		icon,
		iconSize,
		size,
	};
}
