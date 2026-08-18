import { cloneElement } from '@wordpress/element';
import type { ReactElement, ReactNode } from 'react';

/**
 * Fills an optional "slot" element prop with content by cloning it and
 * injecting the given `children`. When `slot` is undefined, the provided
 * `defaultSlot` is used in its place.
 *
 * Shared by overlay `Popup` components for their slot-shaped customization
 * props (e.g. `portal`, `positioner`), so the merge behavior — defaults,
 * children injection — stays consistent across all of them.
 *
 * Callers should type the slot prop as `ReactElement<Omit<Props, 'children'>>`:
 * any subtree passed on the slot element is overwritten by `children`.
 *
 * @param slot        Optional element from the slot prop (e.g. `<Tooltip.Portal … />`
 *                    or `<Tooltip.Positioner … />`). When omitted, `defaultSlot`
 *                    is used. Injected `children` replace any subtree the caller
 *                    may have passed on the slot element.
 * @param defaultSlot Unpopulated default element used when `slot` is omitted
 *                    (e.g. `<Tooltip.Portal />`).
 * @param children    Content to inject as the slot's children (backdrop,
 *                    positioner, popup subtree, etc.).
 */
export function renderSlotWithChildren(
	slot: ReactElement | undefined,
	defaultSlot: ReactElement,
	children: ReactNode
): ReactElement {
	return cloneElement( slot ?? defaultSlot, { children } );
}
