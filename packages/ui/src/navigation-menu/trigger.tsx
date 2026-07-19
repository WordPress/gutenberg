import { NavigationMenu as _NavigationMenu } from '@base-ui/react/navigation-menu';
import { useDirection } from '@base-ui/react/direction-provider';
import clsx from 'clsx';
import {
	Children,
	forwardRef,
	isValidElement,
	useEffect,
} from '@wordpress/element';
import defenseStyles from '../utils/css/global-css-defense.module.css';
import focusStyles from '../utils/css/focus.module.css';
import resetStyles from '../utils/css/resets.module.css';
import {
	ItemLayout,
	ItemLayoutContext,
	useItemContent,
} from '../utils/item-layout';
import itemLayoutStyles from '../utils/item-layout/style.module.css';
import { useItemValidationContext, useNavigationMenuContext } from './context';
import { Icon } from './icon';
import styles from './style.module.css';
import type { TriggerProps } from './types';

type TriggerKeyboardEvent = Parameters<
	NonNullable< TriggerProps[ 'onKeyDown' ] >
>[ 0 ];

/**
 * Renders a disclosure button that opens the corresponding Content.
 */
const Trigger = forwardRef< HTMLButtonElement, TriggerProps >(
	function NavigationMenuTrigger(
		{
			children,
			className,
			prefix,
			shortcut,
			suffix,
			'aria-describedby': ariaDescribedBy,
			'aria-keyshortcuts': ariaKeyShortcuts,
			'aria-label': ariaLabel,
			'aria-labelledby': ariaLabelledBy,
			onKeyDown,
			...props
		},
		ref
	) {
		const { depth, orientation } = useNavigationMenuContext();
		const direction = useDirection();
		const itemValidationContext = useItemValidationContext();
		const childArray = Children.toArray( children );
		const customIcon = childArray.find(
			( child ) => isValidElement( child ) && child.type === Icon
		);
		const contentChildren = customIcon
			? childArray.filter( ( child ) => child !== customIcon )
			: children;
		const { contentContextValue, itemAriaProps, shortcutDescriptionId } =
			useItemContent( contentChildren, {
				'aria-describedby': ariaDescribedBy,
				'aria-keyshortcuts': ariaKeyShortcuts,
				'aria-label': ariaLabel,
				'aria-labelledby': ariaLabelledBy,
				shortcut,
			} );

		useEffect(
			() => itemValidationContext?.registerTrigger(),
			[ itemValidationContext ]
		);

		function handleKeyDown( event: TriggerKeyboardEvent ) {
			onKeyDown?.( event );

			if (
				event.defaultPrevented ||
				event.baseUIHandlerPrevented ||
				event.altKey ||
				event.ctrlKey ||
				event.metaKey ||
				event.shiftKey ||
				depth === 0 ||
				event.currentTarget.getAttribute( 'aria-disabled' ) ===
					'true' ||
				event.currentTarget.getAttribute( 'aria-expanded' ) === 'true'
			) {
				return;
			}

			let openKey = 'ArrowDown';
			if ( orientation === 'vertical' ) {
				openKey = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
			}

			if ( event.key !== openKey ) {
				return;
			}

			// Base UI delegates arrow keys from nested triggers to the parent
			// composite. Activate the disclosure here so focus enters its flyout.
			event.preventDefault();
			event.stopPropagation();
			event.currentTarget.click();
		}

		return (
			<_NavigationMenu.Trigger
				ref={ ref }
				{ ...itemAriaProps }
				onKeyDown={ handleKeyDown }
				className={ clsx(
					defenseStyles.button,
					resetStyles[ 'box-sizing' ],
					focusStyles[ 'outset-ring--focus-visible' ],
					itemLayoutStyles.item,
					styles.interactive,
					styles[ `interactive--${ orientation }` ],
					className
				) }
				{ ...props }
			>
				<ItemLayoutContext.Provider value={ contentContextValue }>
					<ItemLayout
						prefix={ prefix }
						shortcut={ shortcut }
						shortcutDescriptionId={ shortcutDescriptionId }
						suffix={ suffix }
						trailing={ customIcon ?? <Icon /> }
					>
						{ contentChildren }
					</ItemLayout>
				</ItemLayoutContext.Provider>
			</_NavigationMenu.Trigger>
		);
	}
);

export { Trigger };
