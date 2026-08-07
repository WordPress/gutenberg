/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	Button,
	Dropdown,
	Rect,
	SVG,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback, useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useBlockEditContext } from '../../block-edit/context';
import { useCascade, useCustomCssPaths } from '../style-origins/use-cascade';
import OriginPopover from '../style-origins/origin-popover';

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
 * When `isInherited` is true without a local override, nothing is marked —
 * inheritance is the default and needs no treatment.
 *
 * When `hasLocalOverride` is true, a small dot is rendered as a sibling of
 * the control, opening the Style origins cascade for the property.
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
	// Inheritance is the unmarked default: a control showing an inherited value
	// gets no treatment at all. Only a local override is marked. `isInherited`
	// is still accepted and returned so callers need not change.
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

// Matches the colour, duotone and background popovers so the origin popover
// sits in the same place they do, clear of the sidebar.
//
// Those popovers anchor to a full-width row, so `offset: 36` measures from the
// sidebar's inner edge. This one's toggle is a 14px dot at the row's *right*
// edge, so the same offset would leave the popover on top of the sidebar. The
// anchor is therefore resolved to the enclosing panel row (see `setAnchor`),
// which puts both popovers in the same coordinate space.
const ORIGIN_POPOVER_PROPS = {
	placement: 'left-start',
	offset: 36,
	shift: true,
	// Grow to fit rather than capping the height and scrolling: a long cascade
	// is short enough to show whole, and a scrollbar inside it reads as broken.
	resize: false,
};

// Row that visually owns the control the indicator belongs to.
const PANEL_ROW_SELECTOR = '.components-tools-panel-item';

/**
 * The small always-visible dot shown next to a control that overrides an
 * inherited Global Styles value.
 *
 * Activating it opens a popover with the property's cascade and a reset
 * labelled with the value it would restore. It is deliberately not a
 * reset-on-click: a destructive action behind a 14px target, with no indication
 * of what it restores, is the thing this replaces.
 *
 * @param {Object}    props
 * @param {?string}   props.stylePath   Dot-path of the style this control sets
 *                                      (e.g. `typography.fontSize`).
 * @param {?Function} props.onReset     Clears the local override.
 * @param {string}    [props.label]     Human label for the property.
 * @param {string}    [props.className]
 *
 * @return {Element} The indicator and its popover.
 */
export function InheritanceOriginButton( {
	stylePath,
	onReset,
	label,
	className,
} ) {
	const { name, clientId } = useBlockEditContext();
	const [ anchor, setAnchor ] = useState( null );
	const { entries, blockTitle, variationLabels } = useCascade(
		name,
		clientId,
		stylePath
	);

	// Resolve the anchor from the rendered button so the popover lines up with
	// the whole control row rather than the dot at its edge. Falls back to the
	// button itself outside a `ToolsPanel` (colour, duotone, background).
	const setAnchorFromNode = useCallback( ( node ) => {
		setAnchor( node ? node.closest( PANEL_ROW_SELECTOR ) ?? node : null );
	}, [] );

	const popoverProps = useMemo(
		() => ( { ...ORIGIN_POPOVER_PROPS, ...( anchor ? { anchor } : {} ) } ),
		[ anchor ]
	);

	return (
		<Dropdown
			popoverProps={ popoverProps }
			// Focus the popover itself rather than the first control inside it,
			// so opening the cascade does not put a focus ring on "Clear".
			focusOnMount
			renderToggle={ ( { onToggle, isOpen } ) => (
				// Intentionally small (24×24) circular control; exempt from the
				// 40px default-size enforcement rule.
				// eslint-disable-next-line @wordpress/components-no-missing-40px-size-prop
				<Button
					ref={ setAnchorFromNode }
					__next40pxDefaultSize={ false }
					label={
						label
							? sprintf(
									/* translators: %s: Property name, e.g. "Font size". */
									__( 'Where does %s come from?' ),
									label
							  )
							: __( 'Where does this value come from?' )
					}
					// The button has children (the dot), so the tooltip is not
					// shown automatically; opt in explicitly.
					showTooltip
					aria-expanded={ isOpen }
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
						if ( ! isOpen ) {
							// Dismiss any popover already open — a colour
							// picker, say. `stopPropagation` above keeps this
							// click from reaching their outside-click
							// detection, and in the Global Styles sidebar they
							// do not close on their own, so two popovers end up
							// stacked at the same edge. Dispatching on the
							// document body looks like a click outside to all
							// of them; ours is not open yet, so it is
							// unaffected.
							const ownerDocument = event.view?.document;
							ownerDocument?.body?.dispatchEvent(
								new ownerDocument.defaultView.MouseEvent(
									'mousedown',
									{ bubbles: true }
								)
							);
						}
						onToggle();
					} }
				>
					{ /*
					 * The diamond from the Global Styles override-indicator
					 * work (PR #80649): a 6×6 rounded square rotated -45°,
					 * centred in a 24×24 box.
					 */ }
					<SVG
						width="24"
						height="24"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
						aria-hidden="true"
						className="has-local-override-from-global-styles__diamond"
					>
						<Rect
							x="6.34315"
							y="12"
							width="8"
							height="8"
							rx="1"
							transform="rotate(-45 6.34315 12)"
							fill="currentColor"
						/>
					</SVG>
				</Button>
			) }
			renderContent={ ( { onClose } ) => (
				<OriginPopover
					clientId={ clientId }
					stylePath={ stylePath }
					entries={ entries }
					label={ label ?? __( 'This value' ) }
					blockTitle={ blockTitle }
					variationLabels={ variationLabels }
					onReset={
						onReset
							? () => {
									onReset();
									onClose();
							  }
							: undefined
					}
				/>
			) }
		/>
	);
}

/**
 * A `ToolsPanelItem` that reflects whether its control's value is inherited
 * from Global Styles or locally overridden. The two states are mutually
 * exclusive.
 *
 * - Inherited: nothing is marked. Inheritance is the unmarked default.
 * - Local override: a dot is rendered as a plain sibling of the control at the
 *   item's inline-end — never nested in the label — opening the Style origins
 *   cascade for this property. Resetting stays in the `ToolsPanel` options menu
 *   (via `onDeselect`) and in the cascade view.
 *
 * Controls that render their own dot next to a custom toggle (color, background
 * image) pass `showLocalOverrideActionsInLabel={ false }` so the item does not
 * render a second dot.
 *
 * @param {Object}                    props
 * @param {?string}                   props.className                         Item className.
 * @param {boolean}                   props.isInherited                       Value is inherited at rest. Accepted so the `getInheritanceProps` spread does not leak onto the underlying `ToolsPanelItem`; it produces no treatment of its own.
 * @param {boolean}                   props.hasLocalOverride                  Local override is set.
 * @param {import('react').ReactNode} props.label                             Control label.
 * @param {?Function}                 props.onDeselect                        Reset handler.
 * @param {boolean}                   [props.showLocalOverrideActionsInLabel] Render the reset dot here (default true).
 * @param {boolean}                   [props.hasInlineEndToggle]              The control renders a 24x24 toggle (linked/unlink, units switch) at its inline-end; offset the dot to sit just to its inline-start (default false).
 * @param {?string}                   [props.stylePath]                       Dot-path of the style this control sets (e.g. `typography.fontSize`), used to open the matching cascade.
 * @param {import('react').ReactNode} props.children                          The control.
 *
 * @return {Element} The panel item.
 */
export function InheritanceToolsPanelItem( {
	className,
	// Destructured (and unused) so the `getInheritanceProps` spread does not
	// leak `isInherited` onto the underlying `ToolsPanelItem`. Inheritance
	// carries no treatment of its own.
	isInherited,
	hasLocalOverride,
	label,
	onDeselect,
	showLocalOverrideActionsInLabel = true,
	hasInlineEndToggle = false,
	stylePath,
	children,
	...rest
} ) {
	// Custom CSS overrides a property without ever touching its style path, so
	// the panel's own `hasLocalOverride` cannot see it. Treat it as an override
	// here, or the indicator never appears and the cascade that would explain
	// the value is unreachable.
	const customCssPaths = useCustomCssPaths();
	const hasCustomCssOverride =
		!! stylePath && Object.hasOwn( customCssPaths, stylePath );
	const isOverridden = hasLocalOverride || hasCustomCssOverride;
	const showOriginAffordance =
		isOverridden && showLocalOverrideActionsInLabel;

	return (
		<ToolsPanelItem
			className={ clsx( className, {
				// Establishes the containing block the affordance is positioned
				// against. Normally applied by `getInheritanceProps`, which is
				// likewise blind to custom CSS.
				'has-local-override-from-global-styles': hasCustomCssOverride,
			} ) }
			label={ label }
			onDeselect={ onDeselect }
			{ ...rest }
		>
			{ children }
			{ showOriginAffordance && (
				<div
					className={ clsx( 'global-styles-inheritance-affordance', {
						'global-styles-inheritance-affordance--offset-toggle':
							hasInlineEndToggle,
					} ) }
				>
					<InheritanceOriginButton
						stylePath={ stylePath }
						label={ label }
						onReset={ onDeselect }
					/>
				</div>
			) }
		</ToolsPanelItem>
	);
}
