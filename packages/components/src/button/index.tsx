/**
 * External dependencies
 */
import classnames from 'classnames';
import type { ForwardedRef, HTMLProps, MouseEvent, ReactElement } from 'react';

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
import type { WordPressComponentProps } from '../ui/context';
import type {
	ButtonProps,
	ButtonPropsAnchorElement,
	ButtonPropsButtonElement,
	DeprecatedButtonProps,
	TagName,
} from './types';

const disabledEventsOnDisabledButton = [ 'onMouseDown', 'onClick' ] as const;

function hasAnchorProps(
	props: ButtonProps
): props is ButtonPropsAnchorElement {
	return 'href' in props && props.href !== undefined;
}

function hasButtonProps(
	props: ButtonProps
): props is ButtonPropsButtonElement {
	return (
		( 'disabled' in props && !! props?.disabled ) ||
		( '__experimentalIsFocusable' in props &&
			!! props?.__experimentalIsFocusable )
	);
}

function useDeprecatedProps( {
	isDefault,
	isPrimary,
	isSecondary,
	isTertiary,
	isLink,
	variant,
	...otherProps
}:
	| WordPressComponentProps<
			ButtonPropsAnchorElement & DeprecatedButtonProps,
			'a'
	  >
	| WordPressComponentProps<
			ButtonPropsButtonElement & DeprecatedButtonProps,
			'button'
	  > ) {
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
	props:
		| WordPressComponentProps< ButtonPropsAnchorElement, 'a' >
		| WordPressComponentProps< ButtonPropsButtonElement, 'button' >,
	ref: ForwardedRef< any >
) {
	const withDeprecatedProps = useDeprecatedProps( props );
	const {
		isSmall,
		isBusy,
		isDestructive,
		className,
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
	} = withDeprecatedProps;

	const instanceId = useInstanceId(
		Button,
		'components-button__description'
	);

	const isAnchorElement =
		hasAnchorProps( withDeprecatedProps ) &&
		! hasButtonProps( withDeprecatedProps );
	const isButtonElement = ! isAnchorElement;

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
		'is-pressed': isButtonElement && withDeprecatedProps.isPressed,
		'is-busy': isBusy,
		'is-link': variant === 'link',
		'is-destructive': isDestructive,
		'has-text': !! icon && hasChildren,
		'has-icon': !! icon,
	} );

	const trulyDisabled =
		isButtonElement && withDeprecatedProps.disabled && ! isFocusable;
	const Tag = isAnchorElement ? 'a' : 'button';

	const tagProps: HTMLProps< TagName > = isAnchorElement
		? { href: withDeprecatedProps.href, target: withDeprecatedProps.target }
		: {
				type: 'button',
				disabled: trulyDisabled,
				'aria-pressed': withDeprecatedProps.isPressed,
		  };

	if ( isButtonElement && withDeprecatedProps.disabled && isFocusable ) {
		// In this case, the button will be disabled, but still focusable and
		// perceivable by screen reader users.
		tagProps[ 'aria-disabled' ] = true;

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

	const elementProps = {
		...tagProps,
		...additionalProps,
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
				{ ...( elementProps as WordPressComponentProps<
					ButtonPropsAnchorElement,
					'a'
				> ) }
			>
				{ elementChildren }
			</a>
		) : (
			<button
				{ ...( elementProps as WordPressComponentProps<
					ButtonPropsButtonElement,
					'button'
				> ) }
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
