import clsx from 'clsx';
import { Menu as _Menu } from '@base-ui/react/menu';
import { forwardRef, useRef, useState } from '@wordpress/element';
import { useIsomorphicLayoutEffect, useMergeRefs } from '@wordpress/compose';
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
} as const satisfies PositionerProps;

function getSubmenuLabelOffset(
	positioner: HTMLDivElement | null,
	trigger?: HTMLDivElement | null
) {
	const popup = positioner?.querySelector( `.${ styles.popup }` );
	const popupStyles =
		popup?.ownerDocument.defaultView?.getComputedStyle( popup );
	if ( ! positioner || ! popupStyles ) {
		return 0;
	}

	const parentLabel = trigger?.querySelector(
		`.${ styles[ 'item-label' ] }`
	);
	const firstLabel = popup?.querySelector( `.${ styles[ 'item-label' ] }` );
	if ( ! trigger || ! parentLabel || ! firstLabel ) {
		return -(
			parseFloat( popupStyles.paddingTop ) +
			parseFloat( popupStyles.borderTopWidth )
		);
	}

	/*
	 * Labels can have different insets in centered items. Measuring from
	 * the positioner also includes popup padding, borders, and leading content.
	 */
	const parentInset =
		parentLabel.getBoundingClientRect().top -
		trigger.getBoundingClientRect().top;
	const submenuInset =
		firstLabel.getBoundingClientRect().top -
		positioner.getBoundingClientRect().top;

	return parentInset - submenuInset;
}

/**
 * Used to apply custom positioning to `Menu`'s floating content.
 */
const Positioner = forwardRef< HTMLDivElement, PositionerProps >(
	function MenuPositioner( { className, ...props }, ref ) {
		const { isSubmenu, submenuTriggerRef } = useMenuContext();
		const positionerRef = useRef< HTMLDivElement >( null );
		const mergedRef = useMergeRefs( [ ref, positionerRef ] );
		const [ measuredAnchor, setMeasuredAnchor ] =
			useState< PositionerProps[ 'anchor' ] >();
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

			return getSubmenuLabelOffset(
				positionerRef.current,
				props.anchor ? undefined : submenuTriggerRef?.current
			);
		};

		useIsomorphicLayoutEffect( () => {
			if (
				! isSubmenu ||
				props.anchor ||
				props.alignOffset !== undefined ||
				props.disableAnchorTracking
			) {
				return;
			}

			const positioner = positionerRef.current;
			const trigger = submenuTriggerRef?.current;
			const popup = positioner?.querySelector( `.${ styles.popup }` );
			const firstLabel = popup?.querySelector(
				`.${ styles[ 'item-label' ] }`
			);
			const ResizeObserverConstructor =
				positioner?.ownerDocument.defaultView?.ResizeObserver;
			if ( ! trigger || ! firstLabel || ! ResizeObserverConstructor ) {
				return;
			}

			let previousOffset: number | undefined;
			const observer = new ResizeObserverConstructor( () => {
				const nextOffset = getSubmenuLabelOffset( positioner, trigger );
				if (
					previousOffset !== undefined &&
					Math.abs( nextOffset - previousOffset ) < 0.01
				) {
					return;
				}
				previousOffset = nextOffset;
				/*
				 * The popup can keep its maximum height while its first item grows.
				 * Refresh the virtual anchor to make Base UI rerun positioning even
				 * when neither the trigger nor the positioner has resized.
				 */
				setMeasuredAnchor( {
					contextElement: trigger,
					getBoundingClientRect: () =>
						trigger.getBoundingClientRect(),
				} );
			} );
			const observedElements = [
				firstLabel,
				firstLabel.closest( `.${ styles.item }` ),
				popup?.querySelector( `.${ styles.list }` ),
				trigger.querySelector( `.${ styles[ 'item-label' ] }` ),
			];
			observedElements.forEach( ( element ) => {
				if ( element ) {
					observer.observe( element );
				}
			} );
			return () => observer.disconnect();
		}, [
			isSubmenu,
			props.anchor,
			props.alignOffset,
			props.disableAnchorTracking,
			submenuTriggerRef,
		] );

		return (
			<_Menu.Positioner
				{ ...defaultProps }
				anchor={ isSubmenu ? measuredAnchor : undefined }
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
