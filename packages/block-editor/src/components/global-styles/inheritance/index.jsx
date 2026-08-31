import clsx from 'clsx';
import {
	Button,
	Icon as WCIcon,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { reset as resetIcon } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Whether the inspector surfaces inherited Global Styles values.
 *
 * Behind the `gutenberg-global-styles-inheritance-ui` Gutenberg experiment,
 * so the treatment is off unless someone opts in on the Experiments screen.
 * With it off, the panels show locally-set values alone.
 *
 * Evaluated per call rather than once at module scope, so tests can toggle
 * the experiment and so a later move to a store-backed setting only has to
 * change this one place. Always returns a boolean: callers pass the result
 * down as a prop, and `undefined` would trigger a receiving component's own
 * default parameter.
 *
 * @return {boolean} Whether the inherited-value treatment is enabled.
 */
export const isGlobalStylesInheritanceEnabled = () =>
	!! window.__experimentalGlobalStylesInheritanceUI;

/**
 * Returns props to spread onto a wrapping `<InheritanceToolsPanelItem>`
 * so its descendant label picks up the inherited-from-Global-Styles
 * visual treatment.
 *
 * When `isInherited` is true without a local override, the descendant
 * label text receives the inherited-from-Global-Styles treatment
 * (dotted underline). No dot is shown.
 *
 * When `hasLocalOverride` is true, a small reset dot is rendered as a
 * sibling of the control exposing a "Reset to inherited value" action.
 *
 * The two states are mutually exclusive at the source. If both are passed,
 * only the local-override class is returned.
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
		'is-inherited-from-global-styles': inheritedOnly,
		'has-local-override-from-global-styles': !! hasLocalOverride,
	} );
	return {
		...( className ? { className } : {} ),
		isInherited: inheritedOnly,
		hasLocalOverride: !! hasLocalOverride,
	};
}

/**
 * Renders the small always-visible reset button shown next to a control
 * that holds a local override of an inherited Global Styles value. Used by
 * `<InheritanceToolsPanelItem>` and the color/gradient controls.
 *
 * At rest the button shows a blue dot signalling the local override. On
 * hover/focus the dot morphs into the `reset` (dash) icon and the button
 * exposes a "Reset to inherited value" tooltip. Activating it clears the
 * override so the control falls back to its inherited value — the same
 * action the `ToolsPanel` menu performs via `onDeselect`.
 *
 * @param {Object}   props
 * @param {Function} props.onResetToInherited Reset handler.
 * @param {string}   [props.className]        Optional className for the button.
 *
 * @return {Element} The reset button.
 */
export function InheritanceResetButton( { onResetToInherited, className } ) {
	return (
		// Intentionally small (14×14) circular control; exempt from the
		// 40px default-size enforcement rule.
		// eslint-disable-next-line @wordpress/components-no-missing-40px-size-prop
		<Button
			__next40pxDefaultSize={ false }
			label={ __( 'Reset to inherited value' ) }
			// The button has children (the dot + reset icon), so the tooltip
			// is not shown automatically; opt in explicitly.
			showTooltip
			className={ clsx(
				'has-local-override-from-global-styles__reset',
				className
			) }
			onClick={ ( event ) => {
				// Prevent the click from reaching any wrapping
				// `<label htmlFor>` association, which would otherwise
				// focus/activate the inner control.
				event.preventDefault();
				event.stopPropagation();
				onResetToInherited?.();
			} }
		>
			<span
				aria-hidden="true"
				className="has-local-override-from-global-styles__dot"
			/>
			<WCIcon
				className="has-local-override-from-global-styles__reset-icon"
				icon={ resetIcon }
			/>
		</Button>
	);
}

/**
 * A `ToolsPanelItem` that reflects whether its control's value is inherited
 * from Global Styles or locally overridden. The two states are mutually
 * exclusive.
 *
 * - Inherited: the control label receives the inherited-from-Global-Styles
 *   treatment (dotted underline) via the `is-inherited-from-global-styles`
 *   class applied through `getInheritanceProps`. No dot is shown.
 * - Local override: a reset dot is rendered as a plain sibling of the control
 *   at the item's inline-end — never nested in the label — exposing the same
 *   one-click reset the `ToolsPanel` options menu performs via `onDeselect`.
 *
 * Controls that render their own reset control next to a custom toggle (color,
 * background image) pass `showLocalOverrideActionsInLabel={ false }` so the
 * item does not render a second reset dot.
 *
 * @param {Object}                    props
 * @param {?string}                   props.className                         Item className.
 * @param {boolean}                   props.isInherited                       Value is inherited at rest. Accepted so the `getInheritanceProps` spread does not leak onto the underlying `ToolsPanelItem`; the inherited treatment is applied via `className`.
 * @param {boolean}                   props.hasLocalOverride                  Local override is set.
 * @param {import('react').ReactNode} props.label                             Control label.
 * @param {?Function}                 props.onDeselect                        Reset handler.
 * @param {boolean}                   [props.showLocalOverrideActionsInLabel] Render the reset dot here (default true).
 * @param {boolean}                   [props.hasInlineEndToggle]              The control renders a 24x24 toggle (linked/unlink, units switch) at its inline-end; offset the reset dot to sit just to its inline-start (default false).
 * @param {import('react').ReactNode} props.children                          The control.
 *
 * @return {Element} The panel item.
 */
export function InheritanceToolsPanelItem( {
	className,
	// Destructured (and unused) so the `getInheritanceProps` spread does not
	// leak `isInherited` onto the underlying `ToolsPanelItem`. The inherited
	// treatment is applied purely via `className`
	// (`is-inherited-from-global-styles`).
	isInherited,
	hasLocalOverride,
	label,
	onDeselect,
	showLocalOverrideActionsInLabel = true,
	hasInlineEndToggle = false,
	children,
	...rest
} ) {
	const showResetAffordance =
		hasLocalOverride && showLocalOverrideActionsInLabel;

	return (
		<ToolsPanelItem
			className={ className }
			label={ label }
			onDeselect={ onDeselect }
			{ ...rest }
		>
			{ children }
			{ showResetAffordance && (
				<div
					className={ clsx( 'global-styles-inheritance-affordance', {
						'global-styles-inheritance-affordance--offset-toggle':
							hasInlineEndToggle,
					} ) }
				>
					<InheritanceResetButton onResetToInherited={ onDeselect } />
				</div>
			) }
		</ToolsPanelItem>
	);
}
