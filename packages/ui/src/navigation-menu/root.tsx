import { NavigationMenu as _NavigationMenu } from '@base-ui/react/navigation-menu';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import type { ForwardedRef, ReactElement, RefAttributes } from 'react';
import resetStyles from '../utils/css/resets.module.css';
import { NavigationMenuContextProvider } from './context';
import styles from './style.module.css';
import type { RootProps } from './types';

/**
 * Groups all parts of a navigation menu.
 *
 * The outer root renders a navigation landmark and requires an accessible name
 * through `aria-label` or `aria-labelledby`. Nested roots render a neutral
 * container and inherit the surrounding navigation landmark.
 */
function NavigationMenuRoot< Value = unknown >(
	{
		'aria-label': ariaLabel,
		'aria-labelledby': ariaLabelledBy,
		children,
		className,
		orientation = 'horizontal',
		...props
	}: RootProps< Value >,
	ref: ForwardedRef< HTMLElement >
) {
	return (
		<NavigationMenuContextProvider
			isNamed={ !! ( ariaLabel || ariaLabelledBy ) }
			orientation={ orientation }
		>
			<_NavigationMenu.Root< Value >
				ref={ ref }
				aria-label={ ariaLabel }
				aria-labelledby={ ariaLabelledBy }
				className={ clsx(
					resetStyles[ 'box-sizing' ],
					styles.root,
					className
				) }
				data-orientation={ orientation }
				orientation={ orientation }
				{ ...props }
			>
				{ children }
			</_NavigationMenu.Root>
		</NavigationMenuContextProvider>
	);
}

const Root = forwardRef( NavigationMenuRoot ) as < Value = unknown >(
	props: RootProps< Value > & RefAttributes< HTMLElement >
) => ReactElement;

export { Root };
