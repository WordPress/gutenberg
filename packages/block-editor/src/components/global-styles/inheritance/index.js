/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	Button,
	Rect,
	SVG,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { Tooltip } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';

/**
 * Accessible name / tooltip for the local-override indicator.
 *
 * @type {string}
 */
const OVERRIDE_INDICATOR_LABEL = __( 'Overrides inherited styles' );

/**
 * Whether the inspector surfaces inherited Global Styles values.
 * Plugin-only, so Core builds show locally-set values alone.
 *
 * @type {boolean}
 */
export const ENABLE_GLOBAL_STYLES_INHERITANCE = globalThis.IS_GUTENBERG_PLUGIN
	? true
	: false;

/**
 * Returns props to spread onto a wrapping `<InheritanceToolsPanelItem>` so it
 * can mark a local override of an inherited Global Styles value.
 *
 * Inheritance is the default, unmarked state: when a control simply inherits
 * (no local override) it gets no visual treatment at all — the inherited value
 * shows as an ordinary value via the control's native placeholder.
 *
 * When `hasLocalOverride` is true, a filled diamond indicator is rendered as a
 * sibling of the control, hosting an "Overrides inherited styles" tooltip.
 *
 * `isInherited` is still accepted (and returned) so panels can keep passing the
 * resolved at-rest state without changes, but it no longer produces any marker.
 *
 * Returned object shape allows direct spread:
 *
 *     <InheritanceToolsPanelItem
 *         { ...getInheritanceProps( isInherited, hasLocalOverride ) }
 *         label={ __( 'Line height' ) }
 *         …
 *     >
 *
 * @param {boolean}             isInherited      Control is inheriting at rest.
 * @param {boolean}             hasLocalOverride Local override is set AND
 *                                               there is an inherited value
 *                                               being overridden.
 * @param {string|Array|Object} [baseClassName]  Optional className(s) to fold
 *                                               into the returned `className`.
 *
 * @return {{ className?: string, isInherited: boolean, hasLocalOverride: boolean }} Props for the wrapping
 *                                  `InheritanceToolsPanelItem`.
 */
export function getInheritanceProps(
	isInherited,
	hasLocalOverride,
	baseClassName
) {
	const inheritedOnly = !! isInherited && ! hasLocalOverride;
	const className = clsx( baseClassName, {
		'has-local-override-from-global-styles': !! hasLocalOverride,
	} );
	return {
		...( className ? { className } : {} ),
		isInherited: inheritedOnly,
		hasLocalOverride: !! hasLocalOverride,
	};
}

/**
 * The filled diamond drawn inside the override indicator. Meaning comes from the
 * shape plus the button's accessible name, not from color.
 *
 * @return {Element} The diamond.
 */
function Diamond() {
	return (
		<SVG
			width="24"
			height="24"
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
		>
			<Rect
				x="7.75736"
				y="12"
				width="6"
				height="6"
				rx="1"
				transform="rotate(-45 7.75736 12)"
				fill="currentColor"
			/>
		</SVG>
	);
}

/**
 * Renders the small filled diamond that marks a control holding a local override
 * of an inherited Global Styles value. Shared by `<InheritanceToolsPanelItem>`
 * (the standard controls) and the custom controls (color, shadow, duotone,
 * background image) that render it in their own slot.
 *
 * It is a real, enabled `Button` — the trigger the `@wordpress/ui` `Tooltip` is
 * built for, so the "Overrides inherited styles" explanation is reliably
 * reachable by hover *and* keyboard focus (a non-focusable element does not
 * surface it reliably; see
 * [#80506](https://github.com/WordPress/gutenberg/pull/80506)).
 *
 * The button does **nothing but host the tooltip**: it carries no reset and no
 * hover shape-change. Per the review feedback, a control that combines the
 * tooltip with another action is risky because hover/tap-morph behaviours are
 * unavailable to touch users; keeping it purely an indicator means tapping it
 * only opens the tooltip. Resetting is done through the `ToolsPanel` options
 * menu each control already exposes via `onDeselect`.
 *
 * @param {Object} props
 * @param {string} [props.className] Optional className for slot positioning
 *                                   (color/shadow/duotone/background controls).
 *
 * @return {Element} The override indicator.
 */
export function InheritanceOverrideIndicator( { className } ) {
	return (
		<Tooltip.Root>
			<Tooltip.Trigger
				render={
					// Intentionally small (16×16) control; exempt from the
					// 40px default-size enforcement rule.
					// eslint-disable-next-line @wordpress/components-no-missing-40px-size-prop
					<Button
						__next40pxDefaultSize={ false }
						aria-label={ OVERRIDE_INDICATOR_LABEL }
						className={ clsx(
							'global-styles-inheritance-indicator',
							className
						) }
						onClick={ ( event ) => {
							// The button exists only to host the tooltip, so a
							// click does nothing. Prevent it from reaching any
							// wrapping `<label htmlFor>` association (which would
							// otherwise focus/activate the control).
							event.preventDefault();
							event.stopPropagation();
						} }
					>
						<Diamond />
					</Button>
				}
			/>
			<Tooltip.Popup>{ OVERRIDE_INDICATOR_LABEL }</Tooltip.Popup>
		</Tooltip.Root>
	);
}

/**
 * A `ToolsPanelItem` that marks whether its control locally overrides an
 * inherited Global Styles value.
 *
 * - Inherited (the default): no visual treatment — the inherited value shows as
 *   an ordinary value via the control's native placeholder.
 * - Local override: a small, **non-interactive** diamond indicator is rendered
 *   in the label row. It is not a control — it carries no keyboard focus and no
 *   click action, so it sidesteps the "interactive control in the label row"
 *   problem (a real 24px target does not fit the 16px label row without
 *   breaking out). Its meaning reaches assistive tech through an `aria-label`
 *   and sighted mouse users through a hover tooltip. Resetting the override is
 *   done through the `ToolsPanel` options menu the item already exposes via
 *   `onDeselect` — the standard, keyboard-accessible reset path.
 *
 * Controls with a bespoke layout (color, background image, shadow, duotone) pass
 * `showLocalOverrideActionsInLabel={ false }` and render the same
 * `InheritanceOverrideIndicator` in their own slot instead.
 *
 * @param {Object}                    props
 * @param {?string}                   props.className                         Item className.
 * @param {boolean}                   props.isInherited                       Value is inherited at rest. Accepted (and unused) so the `getInheritanceProps` spread does not leak onto the underlying `ToolsPanelItem`; inheritance is the unmarked default and carries no treatment.
 * @param {boolean}                   props.hasLocalOverride                  Local override is set.
 * @param {import('react').ReactNode} props.label                             Control label.
 * @param {?Function}                 props.onDeselect                        Reset handler wired to the `ToolsPanel` options menu.
 * @param {boolean}                   [props.showLocalOverrideActionsInLabel] Render the override indicator here (default true).
 * @param {boolean}                   [props.hasInlineEndToggle]              The control renders a 24x24 toggle (linked/unlink, units switch) at its inline-end; offset the indicator to sit just to its inline-start (default false).
 * @param {import('react').ReactNode} props.children                          The control.
 *
 * @return {Element} The panel item.
 */
export function InheritanceToolsPanelItem( {
	className,
	// Destructured (and unused) so the `getInheritanceProps` spread does not
	// leak `isInherited` onto the underlying `ToolsPanelItem`. Inheritance is
	// the unmarked default state, so this carries no visual treatment.
	isInherited,
	hasLocalOverride,
	label,
	onDeselect,
	showLocalOverrideActionsInLabel = true,
	hasInlineEndToggle = false,
	children,
	...rest
} ) {
	const showIndicator = hasLocalOverride && showLocalOverrideActionsInLabel;

	return (
		<ToolsPanelItem
			className={ className }
			label={ label }
			onDeselect={ onDeselect }
			{ ...rest }
		>
			{ children }
			{ showIndicator && (
				<div
					className={ clsx( 'global-styles-inheritance-affordance', {
						'global-styles-inheritance-affordance--offset-toggle':
							hasInlineEndToggle,
					} ) }
				>
					<InheritanceOverrideIndicator />
				</div>
			) }
		</ToolsPanelItem>
	);
}
