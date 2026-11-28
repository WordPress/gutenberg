import { NavigationMenu as _NavigationMenu } from '@base-ui/react/navigation-menu';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { ITEM_POPUP_POSITIONER_PROPS } from '../form/primitives/constants';
import resetStyles from '../utils/css/resets.module.css';
import { useNavigationMenuContext } from './context';
import styles from './style.module.scss';
import type { PositionerProps } from './types';

/**
 * Positions a flyout against its active Trigger.
 */
const Positioner = forwardRef< HTMLDivElement, PositionerProps >(
	function NavigationMenuPositioner(
		{ align, className, collisionPadding, side, sideOffset, ...props },
		ref
	) {
		const { depth } = useNavigationMenuContext();
		const defaultProps =
			depth > 0
				? {
						...ITEM_POPUP_POSITIONER_PROPS,
						side: 'inline-end' as const,
						sideOffset: -4,
					}
				: { ...ITEM_POPUP_POSITIONER_PROPS, side: 'bottom' as const };

		return (
			<_NavigationMenu.Positioner
				align={ align ?? defaultProps.align }
				className={ clsx(
					resetStyles[ 'box-sizing' ],
					styles.positioner,
					className
				) }
				collisionPadding={
					collisionPadding ?? defaultProps.collisionPadding
				}
				ref={ ref }
				side={ side ?? defaultProps.side }
				sideOffset={ sideOffset ?? defaultProps.sideOffset }
				{ ...props }
			/>
		);
	}
);

export { Positioner };
