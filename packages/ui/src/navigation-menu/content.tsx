import { NavigationMenu as _NavigationMenu } from '@base-ui/react/navigation-menu';
import clsx from 'clsx';
import { forwardRef, useEffect } from '@wordpress/element';
import resetStyles from '../utils/css/resets.module.css';
import { useItemValidationContext } from './context';
import styles from './style.module.css';
import type { ContentProps } from './types';

/**
 * Renders flyout content in the active Viewport.
 */
const Content = forwardRef< HTMLDivElement, ContentProps >(
	function NavigationMenuContent( { className, ...props }, ref ) {
		const itemValidationContext = useItemValidationContext();

		useEffect(
			() => itemValidationContext?.registerContent(),
			[ itemValidationContext ]
		);

		return (
			<_NavigationMenu.Content
				ref={ ref }
				className={ clsx(
					resetStyles[ 'box-sizing' ],
					styles.content,
					className
				) }
				{ ...props }
			/>
		);
	}
);

export { Content };
