import { NavigationMenu as _NavigationMenu } from '@base-ui/react/navigation-menu';
import clsx from 'clsx';
import {
	Children,
	forwardRef,
	isValidElement,
	useEffect,
} from '@wordpress/element';
import defenseStyles from '../utils/css/global-css-defense.module.css';
import resetStyles from '../utils/css/resets.module.css';
import { ItemLayout, useItemContent } from './item-layout';
import itemLayoutStyles from './item-layout/style.module.css';
import { useItemValidationContext, useNavigationMenuContext } from './context';
import { Icon } from './icon';
import styles from './style.module.scss';
import type { TriggerProps } from './types';

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
			...props
		},
		ref
	) {
		const { orientation } = useNavigationMenuContext();
		const itemValidationContext = useItemValidationContext();
		const childArray = Children.toArray( children );
		const customIcon = childArray.find(
			( child ) => isValidElement( child ) && child.type === Icon
		);
		const contentChildren = customIcon
			? childArray.filter( ( child ) => child !== customIcon )
			: children;
		const {
			contentChildren: labelledChildren,
			itemAriaProps,
			shortcutDescriptionId,
		} = useItemContent( contentChildren, {
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

		return (
			<_NavigationMenu.Trigger
				ref={ ref }
				{ ...itemAriaProps }
				className={ clsx(
					defenseStyles.button,
					resetStyles[ 'box-sizing' ],
					itemLayoutStyles.item,
					styles.interactive,
					styles[ `interactive--${ orientation }` ],
					className
				) }
				{ ...props }
			>
				<ItemLayout
					prefix={ prefix }
					shortcut={ shortcut }
					shortcutDescriptionId={ shortcutDescriptionId }
					suffix={ suffix }
					trailing={ customIcon ?? <Icon /> }
				>
					{ labelledChildren }
				</ItemLayout>
			</_NavigationMenu.Trigger>
		);
	}
);

export { Trigger };
