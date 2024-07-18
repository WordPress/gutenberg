/**
 * External dependencies
 */
import clsx from 'clsx';
import type {
	ComponentPropsWithoutRef,
	ForwardedRef,
	HTMLAttributes,
	MouseEvent,
	ReactElement,
} from 'react';

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
import type { ButtonProps, DeprecatedButtonProps } from './types';
import { positionToPlacement } from '../popover/utils';

const disabledEventsOnDisabledButton = [ 'onMouseDown', 'onClick' ] as const;

function useDeprecatedProps( {
	__experimentalIsFocusable,
	isDefault,
	isPrimary,
	isSecondary,
	isTertiary,
	isLink,
	isPressed,
	isSmall,
	size,
	variant,
	describedBy,
	...otherProps
}: ButtonProps & DeprecatedButtonProps ): ButtonProps {
	let computedSize = size;
	let computedVariant = variant;

	const newProps = {
		accessibleWhenDisabled: __experimentalIsFocusable,
		// @todo Mark `isPressed` as deprecated
		'aria-pressed': isPressed,
		description: describedBy,
	};

	if ( isSmall ) {
		computedSize ??= 'small';
	}

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
		deprecated( 'wp.components.Button `isDefault` prop', {
			since: '5.4',
			alternative: 'variant="secondary"',
		} );

		computedVariant ??= 'secondary';
	}

	if ( isLink ) {
		computedVariant ??= 'link';
	}

	return {
		...newProps,
		...otherProps,
		size: computedSize,
		variant: computedVariant,
	};
}

export function UnforwardedButton(
	props: ButtonProps & DeprecatedButtonProps,
	ref: ForwardedRef< any >
) {
	const {
		__next40pxDefaultSize,
		accessibleWhenDisabled,
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
		size = 'default',
		text,
		variant,
		description,
		...buttonOrAnchorProps
	} = useDeprecatedProps( props );

	const {
		href,
		target,
		'aria-checked': ariaChecked,
		'aria-pressed': ariaPressed,
		'aria-selected': ariaSelected,
		...additionalProps
	} = 'href' in buttonOrAnchorProps
		? buttonOrAnchorProps
		: { href: undefined, target: undefined, ...buttonOrAnchorProps };

	const instanceId = useInstanceId(
		Button,
		'components-button__description'
	);

	const hasChildren =
		( 'string' === typeof children && !! children ) ||
		( Array.isArray( children ) &&
			children?.[ 0 ] &&
			children[ 0 ] !== null &&
			// Tooltip should not considered as a child
			children?.[ 0 ]?.props?.className !== 'components-tooltip' );

	const truthyAriaPressedValues: ( typeof ariaPressed )[] = [
		true,
		'true',
		'mixed',
	];

	const classes = clsx( 'components-button', className, {
		'is-next-40px-default-size': __next40pxDefaultSize,
		'is-secondary': variant === 'secondary',
		'is-primary': variant === 'primary',
		'is-small': size === 'small',
		'is-compact': size === 'compact',
		'is-tertiary': variant === 'tertiary',

		'is-pressed': truthyAriaPressedValues.includes( ariaPressed ),
		'is-pressed-mixed': ariaPressed === 'mixed',

		'is-busy': isBusy,
		'is-link': variant === 'link',
		'is-destructive': isDestructive,
		'has-text': !! icon && ( hasChildren || text ),
		'has-icon': !! icon,
	} );

	const trulyDisabled = disabled && ! accessibleWhenDisabled;
	const Tag = href !== undefined && ! disabled ? 'a' : 'button';
	const buttonProps: ComponentPropsWithoutRef< 'button' > =
		Tag === 'button'
			? {
					type: 'button',
					disabled: trulyDisabled,
					'aria-checked': ariaChecked,
					'aria-pressed': ariaPressed,
					'aria-selected': ariaSelected,
			  }
			: {};
	const anchorProps: ComponentPropsWithoutRef< 'a' > =
		Tag === 'a' ? { href, target } : {};

	const disableEventProps: {
		[ key: string ]: ( event: MouseEvent ) => void;
	} = {};
	if ( disabled && accessibleWhenDisabled ) {
		// In this case, the button will be disabled, but still focusable and
		// perceivable by screen reader users.
		buttonProps[ 'aria-disabled' ] = true;
		anchorProps[ 'aria-disabled' ] = true;
		for ( const disabledEvent of disabledEventsOnDisabledButton ) {
			disableEventProps[ disabledEvent ] = ( event: MouseEvent ) => {
				if ( event ) {
					event.stopPropagation();
					event.preventDefault();
				}
			};
		}
	}

	// Should show the tooltip if...
	const shouldShowTooltip =
		! trulyDisabled &&
		// An explicit tooltip is passed or...
		( ( showTooltip && !! label ) ||
			// There's a shortcut or...
			!! shortcut ||
			// There's a label and...
			( !! label &&
				// The children are empty and...
				! ( children as string | ReactElement[] )?.length &&
				// The tooltip is not explicitly disabled.
				false !== showTooltip ) );

	const descriptionId = description ? instanceId : undefined;

	const describedById =
		additionalProps[ 'aria-describedby' ] || descriptionId;

	const commonProps = {
		className: classes,
		'aria-label': additionalProps[ 'aria-label' ] || label,
		'aria-describedby': describedById,
		ref,
	};

	const elementChildren = (
		<>
			{ icon && iconPosition === 'left' && (
				<Icon icon={ icon } size={ iconSize } />
			) }
			{ text && <>{ text }</> }
			{ children }
			{ icon && iconPosition === 'right' && (
				<Icon icon={ icon } size={ iconSize } />
			) }
		</>
	);

	const element =
		Tag === 'a' ? (
			<a
				{ ...anchorProps }
				{ ...( additionalProps as HTMLAttributes< HTMLAnchorElement > ) }
				{ ...disableEventProps }
				{ ...commonProps }
			>
				{ elementChildren }
			</a>
		) : (
			<button
				{ ...buttonProps }
				{ ...( additionalProps as HTMLAttributes< HTMLButtonElement > ) }
				{ ...disableEventProps }
				{ ...commonProps }
			>
				{ elementChildren }
			</button>
		);

	// In order to avoid some React reconciliation issues, we are always rendering
	// the `Tooltip` component even when `shouldShowTooltip` is `false`.
	// In order to make sure that the tooltip doesn't show when it shouldn't,
	// we don't pass the props to the `Tooltip` component.
	const tooltipProps = shouldShowTooltip
		? {
				text:
					( children as string | ReactElement[] )?.length &&
					description
						? description
						: label,
				shortcut,
				placement:
					tooltipPosition &&
					// Convert legacy `position` values to be used with the new `placement` prop
					positionToPlacement( tooltipPosition ),
		  }
		: {};

	return (
		<>
			<Tooltip { ...tooltipProps }>{ element }</Tooltip>
			{ description && (
				<VisuallyHidden>
					<span id={ descriptionId }>{ description }</span>
				</VisuallyHidden>
			) }
		</>
	);
}

/**
 * Lets users take actions and make choices with a single click or tap.
 *
 * ```jsx
 * import { Button } from '@wordpress/components';
 * const Mybutton = () => (
 *   <Button
 *     variant="primary"
 *     onClick={ handleClick }
 *   >
 *     Click here
 *   </Button>
 * );
 * ```
 */
export const Button = forwardRef( UnforwardedButton );
export default Button;
