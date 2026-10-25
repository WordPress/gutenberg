import clsx from 'clsx';
import { Menu as _Menu } from '@base-ui/react/menu';
import { forwardRef, useCallback, useRef, useState } from '@wordpress/element';
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

type AlignOffsetFunction = Exclude<
	PositionerProps[ 'alignOffset' ],
	number | undefined
>;

function getSubmenuLabelOffset(
	positioner: HTMLDivElement | null,
	trigger?: HTMLDivElement | null
) {
	const popup = positioner?.querySelector( `.${ styles.popup }` );
	if ( ! positioner || ! popup ) {
		return 0;
	}

	const parentLabel = trigger?.querySelector(
		`.${ styles[ 'item-label' ] }`
	);
	const firstLabel = popup?.querySelector( `.${ styles[ 'item-label' ] }` );
	if ( ! trigger || ! parentLabel || ! firstLabel ) {
		const popupStyles =
			popup.ownerDocument.defaultView?.getComputedStyle( popup );
		if ( ! popupStyles ) {
			return 0;
		}
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
		const lastOffsetRef = useRef< number >( 0 );
		const defaultProps = isSubmenu
			? MENU_SUBMENU_POPUP_POSITIONER_PROPS
			: ITEM_POPUP_POSITIONER_PROPS;

		const alignOffset = useCallback< AlignOffsetFunction >(
			( dimensions ) => {
				const { side, align } = dimensions;
				if (
					side === 'top' ||
					side === 'bottom' ||
					align !== 'start'
				) {
					return 0;
				}

				const positioner = positionerRef.current;
				if ( ! positioner ) {
					return 0;
				}
				if (
					positioner.hidden ||
					positioner.hasAttribute( 'data-closed' )
				) {
					return lastOffsetRef.current;
				}
				const trigger = props.anchor
					? undefined
					: submenuTriggerRef?.current;
				const offset = getSubmenuLabelOffset( positioner, trigger );
				lastOffsetRef.current = offset;
				return offset;
			},
			[ props.anchor, submenuTriggerRef ]
		);

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

			const observer = new ResizeObserverConstructor( () => {
				if (
					! positioner ||
					positioner.hidden ||
					positioner.hasAttribute( 'data-closed' ) ||
					positioner.dataset.side === 'top' ||
					positioner.dataset.side === 'bottom' ||
					positioner.dataset.align !== 'start'
				) {
					return;
				}
				const nextOffset = getSubmenuLabelOffset( positioner, trigger );
				const previousOffset = lastOffsetRef.current;
				lastOffsetRef.current = nextOffset;
				if (
					previousOffset !== undefined &&
					Math.abs( nextOffset - previousOffset ) < 0.01
				) {
					return;
				}
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
