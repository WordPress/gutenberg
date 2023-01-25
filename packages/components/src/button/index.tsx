/**
 * External dependencies
 */
import classnames from 'classnames';
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

const disabledEventsOnDisabledButton = [ 'onMouseDown', 'onClick' ] as const;

function useDeprecatedProps( {
	isDefault,
	isPrimary,
	isSecondary,
	isTertiary,
	isLink,
	variant,
	...otherProps
}: ButtonProps & DeprecatedButtonProps ): ButtonProps {
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
			version: '6.2',
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

export function UnforwardedButton(
	props: ButtonProps,
	ref: ForwardedRef< any >
) {
	const {
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
		...buttonOrAnchorProps
	} = useDeprecatedProps( props );

	const { href, target, ...additionalProps } =
		'href' in buttonOrAnchorProps
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

	const classes = classnames( 'components-button', className, {
		'is-secondary': variant === 'secondary',
		'is-primary': variant === 'primary',
		'is-small': isSmall,
		'is-tertiary': variant === 'tertiary',
		'is-pressed': isPressed,
		'is-busy': isBusy,
		'is-link': variant === 'link',
		'is-destructive': isDestructive,
		'has-text': !! icon && hasChildren,
		'has-icon': !! icon,
	} );

	const trulyDisabled = disabled && ! isFocusable;
	const Tag = href !== undefined && ! trulyDisabled ? 'a' : 'button';
	const buttonProps: ComponentPropsWithoutRef< 'button' > =
		Tag === 'button'
			? {
					type: 'button',
					disabled: trulyDisabled,
					'aria-pressed': isPressed,
			  }
			: {};
	const anchorProps: ComponentPropsWithoutRef< 'a' > =
		Tag === 'a' ? { href, target } : {};

	if ( disabled && isFocusable ) {
		// In this case, the button will be disabled, but still focusable and
		// perceivable by screen reader users.
		buttonProps[ 'aria-disabled' ] = true;
		anchorProps[ 'aria-disabled' ] = true;

		for ( const disabledEvent of disabledEventsOnDisabledButton ) {
			additionalProps[ disabledEvent ] = ( event: MouseEvent ) => {
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
		( ( showTooltip && label ) ||
			// There's a shortcut or...
			shortcut ||
			// There's a label and...
			( !! label &&
				// The children are empty and...
				! ( children as string | ReactElement[] )?.length &&
				// The tooltip is not explicitly disabled.
				false !== showTooltip ) );

	const descriptionId = describedBy ? instanceId : undefined;

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
			{ icon && iconPosition === 'right' && (
				<Icon icon={ icon } size={ iconSize } />
			) }
			{ children }
		</>
	);

	const element =
		Tag === 'a' ? (
			<a
				{ ...anchorProps }
				{ ...( additionalProps as HTMLAttributes< HTMLAnchorElement > ) }
				{ ...commonProps }
			>
				{ elementChildren }
			</a>
		) : (
			<button
				{ ...buttonProps }
				{ ...( additionalProps as HTMLAttributes< HTMLButtonElement > ) }
				{ ...commonProps }
			>
				{ elementChildren }
			</button>
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
				text={
					( children as string | ReactElement[] )?.length &&
					describedBy
						? describedBy
						: label
				}
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
