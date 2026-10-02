import clsx from 'clsx';
import { Menu as _Menu } from '@base-ui/react/menu';
import { forwardRef, useRef } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
import { ITEM_POPUP_POSITIONER_PROPS } from '../form/primitives/constants';
import resetStyles from '../utils/css/resets.module.css';
import styles from './style.module.css';
import { useMenuContext } from './context';
import type { PositionerProps } from './types';

const MENU_SUBMENU_POPUP_POSITIONER_PROPS = {
	side: 'inline-end',
	align: 'start',
	sideOffset: -4,
	collisionPadding: 12,
} as const;

/**
 * Used to apply custom positioning to `Menu`'s floating content.
 */
const Positioner = forwardRef< HTMLDivElement, PositionerProps >(
	function MenuPositioner( { className, ...props }, ref ) {
		const { isSubmenu } = useMenuContext();
		const positionerRef = useRef< HTMLDivElement >( null );
		const mergedRef = useMergeRefs( [ ref, positionerRef ] );
		const defaultProps = isSubmenu
			? MENU_SUBMENU_POPUP_POSITIONER_PROPS
			: ITEM_POPUP_POSITIONER_PROPS;

		const alignOffset: PositionerProps[ 'alignOffset' ] = ( {
			side,
			align,
		} ) => {
			if ( side === 'top' || side === 'bottom' || align !== 'start' ) {
				return 0;
			}

			const popup = positionerRef.current?.querySelector(
				`.${ styles.popup }`
			);
			const popupStyles =
				popup?.ownerDocument.defaultView?.getComputedStyle( popup );
			if ( ! popupStyles ) {
				return 0;
			}

			return -(
				parseFloat( popupStyles.paddingTop ) +
				parseFloat( popupStyles.borderTopWidth )
			);
		};

		return (
			<_Menu.Positioner
				{ ...defaultProps }
				alignOffset={ isSubmenu ? alignOffset : undefined }
				{ ...props }
				ref={ mergedRef }
				className={ clsx(
					resetStyles[ 'box-sizing' ],
					styles.positioner,
					className
				) }
			/>
		);
	}
);

export { Positioner };
