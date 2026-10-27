import {
	// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
	Menu,
} from '@wordpress/ui';
import { useRefEffect } from '@wordpress/compose';
import type { ReactNode } from 'react';

/**
 * Flyouts open on click, Enter or the right arrow key, not on hover. Opened on
 * hover, the menu hands the pointer to its own hover logic, which closes the
 * flyout as soon as the pointer slows down or curves on its way into it.
 */
export const SUBMENU_TRIGGER_PROPS = { openOnHover: false } as const;

/**
 * How long the pointer can rest while heading for a flyout before the menu
 * treats it as having stopped there, in milliseconds.
 */
const AIM_REST_TIME = 300;

/**
 * How far above and below a flyout the pointer can aim and still count as
 * heading for it, in pixels.
 */
const AIM_TOLERANCE = 16;

/**
 * How far the pointer has to move for the menu to judge where it is heading,
 * in pixels.
 */
const AIM_MIN_DISTANCE = 2;

/**
 * The pointer events the menu reacts to by highlighting an item.
 */
const AIM_EVENT_TYPES = [
	'mousemove',
	'pointermove',
	'mouseover',
	'pointerover',
	'mouseout',
	'pointerout',
	'mouseenter',
	'pointerenter',
	'mouseleave',
	'pointerleave',
] as const;

/**
 * The pointer events whose related target is the element the pointer moves
 * onto.
 */
const LEAVING_EVENT_TYPES = [
	'mouseout',
	'pointerout',
	'mouseleave',
	'pointerleave',
];

type Point = { x: number; y: number };

function sign( p1: Point, p2: Point, p3: Point ) {
	return (
		( p1.x - p3.x ) * ( p2.y - p3.y ) - ( p2.x - p3.x ) * ( p1.y - p3.y )
	);
}

function isPointInTriangle( point: Point, a: Point, b: Point, c: Point ) {
	const d1 = sign( point, a, b );
	const d2 = sign( point, b, c );
	const d3 = sign( point, c, a );
	const hasNegative = d1 < 0 || d2 < 0 || d3 < 0;
	const hasPositive = d1 > 0 || d2 > 0 || d3 > 0;
	return ! ( hasNegative && hasPositive );
}

/**
 * Keeps a flyout open while the pointer moves from its trigger towards it.
 *
 * Moving diagonally into a flyout crosses other items of the menu. The menu
 * reacts to the pointer moving over one of them by highlighting it and closing
 * the flyout, so the flyout closes before the pointer gets there. While the
 * pointer is heading for the open flyout, this stops those pointer events at
 * the menu, as in the "menu aim" approach. Moving another way, or resting on
 * an item, lets the menu react as usual.
 *
 * @return A ref for the menu popup.
 */
export function useFlyoutAim() {
	return useRefEffect( ( popup: HTMLElement ) => {
		const { ownerDocument } = popup;
		let lastPoint: ( Point & { time: number } ) | null = null;
		let isAiming = false;

		function getOpenFlyout() {
			const triggers = popup.querySelectorAll< HTMLElement >(
				'[aria-haspopup="menu"][aria-expanded="true"]'
			);
			// Only flyouts of this menu, not of the menus nested in it.
			const trigger = Array.from( triggers ).find(
				( element ) => element.closest( '[role="menu"]' ) === popup
			);
			const flyoutId = trigger?.getAttribute( 'aria-controls' );
			const flyout = flyoutId && ownerDocument.getElementById( flyoutId );
			return trigger && flyout ? { trigger, flyout } : null;
		}

		/**
		 * Decides whether the pointer is heading for the open flyout. Only
		 * pointer move events decide: the mouse events that follow them carry
		 * the same position rounded to whole pixels, which can read as a move
		 * away from the flyout.
		 *
		 * @param event        The pointer move event.
		 * @param open         The open flyout and its trigger.
		 * @param open.trigger The trigger of the flyout.
		 * @param open.flyout  The flyout.
		 * @return Whether the pointer is heading for the flyout.
		 */
		function updateAim(
			event: MouseEvent,
			open: { trigger: HTMLElement; flyout: HTMLElement }
		) {
			const point = {
				x: event.clientX,
				y: event.clientY,
				time: event.timeStamp,
			};
			const previous = lastPoint;
			// A tiny move keeps the decision, so it does not decide alone.
			if (
				previous &&
				Math.hypot( point.x - previous.x, point.y - previous.y ) <
					AIM_MIN_DISTANCE
			) {
				return isAiming;
			}
			lastPoint = point;
			// After resting, the pointer has stopped where it is.
			if ( ! previous || point.time - previous.time > AIM_REST_TIME ) {
				return false;
			}
			const flyoutRect = open.flyout.getBoundingClientRect();
			const triggerRect = open.trigger.getBoundingClientRect();
			const isOnRight = flyoutRect.left >= triggerRect.left;
			const edgeX = isOnRight ? flyoutRect.left : flyoutRect.right;
			return isPointInTriangle(
				point,
				previous,
				{ x: edgeX, y: flyoutRect.top - AIM_TOLERANCE },
				{ x: edgeX, y: flyoutRect.bottom + AIM_TOLERANCE }
			);
		}

		function onPointerEvent( event: MouseEvent ) {
			const open = getOpenFlyout();
			if ( ! open ) {
				lastPoint = null;
				isAiming = false;
				return;
			}
			if ( event.type === 'pointermove' ) {
				isAiming = updateAim( event, open );
			}
			// The element the pointer moves onto. For an out or leave event,
			// that is the related target, not the element it leaves.
			const enteredElement = (
				LEAVING_EVENT_TYPES.includes( event.type )
					? event.relatedTarget
					: event.target
			) as Node | null;
			if (
				isAiming &&
				! open.trigger.contains( enteredElement ) &&
				! open.flyout.contains( enteredElement )
			) {
				event.stopPropagation();
			}
		}

		// Listening in the capture phase also catches the enter and leave
		// events, which do not bubble. React derives its own enter and leave
		// events from the over and out events, so those are stopped too.
		for ( const type of AIM_EVENT_TYPES ) {
			popup.addEventListener( type, onPointerEvent, true );
		}
		return () => {
			for ( const type of AIM_EVENT_TYPES ) {
				popup.removeEventListener( type, onPointerEvent, true );
			}
		};
	}, [] );
}

/**
 * The popup of a flyout in the menus of the redesigned toolbar.
 *
 * The menus stack above the editor, so their flyouts have to stack above
 * them in turn. Otherwise the menu covers the edge where the flyout overlaps
 * it, and moving the pointer into the flyout lands on another item of the
 * menu, which closes the flyout.
 *
 * @param props          Component props.
 * @param props.children The flyout items.
 */
export default function SubmenuPopup( { children }: { children: ReactNode } ) {
	return (
		<Menu.Popup
			positioner={
				<Menu.Positioner className="block-editor-block-toolbar__submenu-positioner" />
			}
		>
			{ children }
		</Menu.Popup>
	);
}
