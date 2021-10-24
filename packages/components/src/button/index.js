// @ts-nocheck
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
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Tooltip from '../tooltip';
import Icon from '../icon';
import { VisuallyHidden } from '../visually-hidden';

const disabledEventsOnDisabledButton = [ 'onMouseDown', 'onClick' ];

function useDeprecatedProps( {
	isDefault,
	isPrimary,
	isSecondary,
	isTertiary,
	isLink,
	variant,
	...otherProps
} ) {
	let computedVariant = variant;

	if ( isPrimary ) {
		computedVariant ??= 'primary';
	}

	if ( isTertiary ) {
		computedVariant ??= 'tertiary';
	}

	if ( isSecondary ) {
		computedVariant ??= 'secondary';
	}

	if ( isDefault ) {
		deprecated( 'Button isDefault prop', {
			since: '5.4',
			alternative: 'variant="secondary"',
		} );

		computedVariant ??= 'secondary';
	}

	if ( isLink ) {
		computedVariant ??= 'link';
	}

	return {
		...otherProps,
		variant: computedVariant,
	};
}

export function Button( props, ref ) {
	const {
		href,
		target,
		isSmall,
		isPressed,
		isBusy,
		isDestructive,
		className,
		disabled,
		icon,
		iconPosition = 'left',
		iconSize,
		showTooltip,
		tooltipPosition,
		shortcut,
		label,
		children,
		text,
		variant,
		__experimentalIsFocusable: isFocusable,
		describedBy,
		...additionalProps
	} = useDeprecatedProps( props );
	const instanceId = useInstanceId(
		Button,
		'components-button__description'
	);

	const classes = classnames( 'components-button', className, {
		'is-secondary': variant === 'secondary',
		'is-primary': variant === 'primary',
		'is-small': isSmall,
		'is-tertiary': variant === 'tertiary',
		'is-pressed': isPressed,
		'is-busy': isBusy,
		'is-link': variant === 'link',
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

	const descriptionId = describedBy ? instanceId : null;

	const describedById =
		additionalProps[ 'aria-describedby' ] || descriptionId;

	const element = (
		<Tag
			{ ...tagProps }
			{ ...additionalProps }
			className={ classes }
			aria-label={ additionalProps[ 'aria-label' ] || label }
			aria-describedby={ describedById }
			ref={ ref }
		>
			{ icon && iconPosition === 'left' && (
				<Icon icon={ icon } size={ iconSize } />
			) }
			{ text && <>{ text }</> }
			{ icon && iconPosition === 'right' && (
				<Icon icon={ icon } size={ iconSize } />
			) }
			{ children }
		</Tag>
	);

	if ( ! shouldShowTooltip ) {
		return (
			<>
				{ element }
				{ describedBy && (
					<VisuallyHidden>
						<span id={ descriptionId }>{ describedBy }</span>
					</VisuallyHidden>
				) }
			</>
		);
	}

	return (
		<>
			<Tooltip
				text={ describedBy ? describedBy : label }
				shortcut={ shortcut }
				position={ tooltipPosition }
			>
				{ element }
			</Tooltip>
			{ describedBy && (
				<VisuallyHidden>
					<span id={ descriptionId }>{ describedBy }</span>
				</VisuallyHidden>
			) }
		</>
	);
}

export default forwardRef( Button );
