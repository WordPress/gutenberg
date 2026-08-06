/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __experimentalToolsPanelItem as ToolsPanelItem } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useInheritanceMenuItem } from './panel-menu';

export { isGlobalStylesInheritanceEnabled } from './is-enabled';

/**
 * Returns props to spread onto a wrapping `<InheritanceToolsPanelItem>`
 * so its descendant label picks up the inherited-from-Global-Styles
 * visual treatment.
 *
 * When `isInherited` is true without a local override, the descendant
 * label text receives the inherited-from-Global-Styles treatment
 * (dotted underline). No dot is shown.
 *
 * When `hasLocalOverride` is true, the class marking the override is returned;
 * the override itself is reported in the panel's options menu.
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
 * A `ToolsPanelItem` that reflects whether its control's value is inherited
 * from Global Styles or locally overridden. The two states are mutually
 * exclusive.
 *
 * - Inherited: the control label receives the inherited-from-Global-Styles
 *   treatment (dotted underline) via the `is-inherited-from-global-styles`
 *   class applied through `getInheritanceProps`. No dot is shown.
 * - Local override: nothing is rendered in the row. The override is reported in
 *   the panel's options menu instead, which the item registers itself with
 *   here, under the `Reset` that already puts the value back.
 *
 * `showLocalOverrideActionsInLabel` and `hasInlineEndToggle` positioned the
 * per-control reset dot this placement replaces. They are still accepted so the
 * panels that pass them keep working, but no longer do anything.
 *
 * @param {Object}                    props
 * @param {?string}                   props.className                         Item className.
 * @param {boolean}                   props.isInherited                       Value is inherited at rest. Accepted so the `getInheritanceProps` spread does not leak onto the underlying `ToolsPanelItem`; the inherited treatment is applied via `className`.
 * @param {boolean}                   props.hasLocalOverride                  Local override is set.
 * @param {import('react').ReactNode} props.label                             Control label.
 * @param {?Function}                 props.onDeselect                        Reset handler.
 * @param {boolean}                   [props.showLocalOverrideActionsInLabel] Inert; see above.
 * @param {boolean}                   [props.hasInlineEndToggle]              Inert; see above.
 * @param {?string[]}                 [props.stylePaths]                      Dot-paths the control writes (e.g. `[ 'typography.fontSize' ]`), used to resolve the cascade shown in the panel's options menu.
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
	// Destructured (and unused) so they do not leak onto the underlying
	// `ToolsPanelItem`. Both only ever positioned the reset dot.
	showLocalOverrideActionsInLabel,
	hasInlineEndToggle,
	stylePaths,
	children,
	...rest
} ) {
	// `label` doubles as the key `ToolsPanel` builds its menu items from, so the
	// cascade lands under this control's own row in the panel's options menu —
	// beside the `Reset` that already puts the value back.
	useInheritanceMenuItem( label, hasLocalOverride, stylePaths );

	return (
		<ToolsPanelItem
			className={ className }
			label={ label }
			onDeselect={ onDeselect }
			{ ...rest }
		>
			{ children }
		</ToolsPanelItem>
	);
}
