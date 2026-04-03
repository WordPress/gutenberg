import { Popover as _Popover } from '@base-ui/react/popover';
import type { RootProps } from './types';

/**
 * An accessible popup anchored to a trigger element.
 *
 * Popover renders ARIA-compliant floating content that appears next to its
 * trigger. It can contain interactive content such as form controls, menus,
 * and rich descriptions.
 *
 * Compose the compound components to build a popover:
 *
 * - `Popover.Root` — provides open state and context to all sub-components.
 * - `Popover.Trigger` — the button that toggles the popup.
 * - `Popover.Popup` — the floating container (portal, positioning, collision
 *   avoidance).
 * - `Popover.Arrow` — an optional arrow pointing toward the anchor.
 * - `Popover.Title` — **required** heading that labels the popover for
 *   accessibility (can be visually hidden).
 * - `Popover.Description` — optional paragraph linked via `aria-describedby`.
 * - `Popover.Close` — a button that closes the popover when clicked.
 *   **Required** when `modal` is `true` or `'trap-focus'` so that focus
 *   can cycle correctly and the user can dismiss the popover.
 *
 * ```jsx
 * <Popover.Root>
 *   <Popover.Trigger>Open</Popover.Trigger>
 *   <Popover.Popup>
 *     <Popover.Arrow />
 *     <Popover.Title>Popover title</Popover.Title>
 *     <Popover.Description>Popover description</Popover.Description>
 *     <Popover.Close>Close</Popover.Close>
 *   </Popover.Popup>
 * </Popover.Root>
 * ```
 */
function Root( props: RootProps ) {
	return <_Popover.Root { ...props } />;
}

export { Root };
