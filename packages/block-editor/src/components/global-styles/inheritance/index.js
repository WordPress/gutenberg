/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Tooltip } from '@wordpress/ui';

const INHERITED_LABEL = __( 'Inherited from Global Styles' );

/**
 * Returns props to spread onto a wrapping `<InheritanceToolsPanelItem>`
 * so the item renders the matching inherited-from-Global-Styles affordance.
 *
 * When `isInherited` is true without a local override, a purple rhombus
 * indicator is rendered as a sibling of the control, exposing an
 * "Inherited from Global Styles" tooltip.
 *
 * When `hasLocalOverride` is true, the same slot holds a blue reset dot
 * exposing a "Reset to inherited value" action.
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
 * Renders the small always-visible affordance shown next to a control that
 * either inherits its value from Global Styles or locally overrides one. Used
 * by `<InheritanceToolsPanelItem>` and the color/gradient controls.
 *
 * It is deliberately a *single* button across both states rather than two that
 * swap places: activating the reset in the override state leaves the control
 * inheriting again, and a second button taking over the slot would unmount the
 * one the user just activated and drop focus. Only the shape, the accessible
 * name and the click behaviour change.
 *
 * - Inheriting: a purple rhombus with an "Inherited from Global Styles"
 *   tooltip. It carries no action; it is a button so the explanation is
 *   reachable by hover *and* keyboard focus, which a cue attached to the
 *   control label could not offer without stealing the label's own focus
 *   behaviour.
 * - Local override: a blue dot that morphs into the `reset` (dash) icon on
 *   hover/focus, with a "Reset to inherited value" tooltip. Activating it
 *   clears the override — the same action the `ToolsPanel` menu performs via
 *   `onDeselect` — and the button becomes the inherited rhombus in place.
 *
 * @param {Object}    props
 * @param {boolean}   [props.hasLocalOverride]   Render the reset state instead of the inherited one.
 * @param {?Function} [props.onResetToInherited] Reset handler, used by the override state.
 * @param {string}    [props.className]          Optional className for the button.
 *
 * @return {Element} The inheritance affordance.
 */
export function InheritanceIndicatorButton( {
	hasLocalOverride = false,
	onResetToInherited,
	className,
} ) {
	const label = hasLocalOverride
		? __( 'Reset to inherited value' )
		: INHERITED_LABEL;

	return (
		<Tooltip.Root>
			<Tooltip.Trigger
				render={
					// Intentionally small (14×14) control; exempt from the
					// 40px default-size enforcement rule.
					// eslint-disable-next-line @wordpress/components-no-missing-40px-size-prop
					<Button
						__next40pxDefaultSize={ false }
						aria-label={ label }
						disabled={ ! hasLocalOverride }
						accessibleWhenDisabled
						className={ clsx(
							'global-styles-inheritance-indicator',
							{
								'has-local-override': hasLocalOverride,
							},
							className
						) }
						onClick={ ( event ) => {
							// Prevent the click from reaching any wrapping
							// `<label htmlFor>` association, which would
							// otherwise focus/activate the inner control.
							event.preventDefault();
							event.stopPropagation();
							if ( hasLocalOverride ) {
								onResetToInherited?.();
							}
						} }
					/>
				}
			/>
			<Tooltip.Popup>{ label }</Tooltip.Popup>
		</Tooltip.Root>
	);
}

/**
 * A `ToolsPanelItem` that reflects whether its control's value is inherited
 * from Global Styles or locally overridden. The two states are mutually
 * exclusive.
 *
 * Both states are carried by one `<InheritanceIndicatorButton>` rendered as a
 * plain sibling of the control at the item's inline-end, never nested in the
 * label, so resetting an override keeps focus on the button.
 *
 * Controls that render their own affordance next to a custom toggle (color,
 * background image) pass `showInheritanceAffordance={ false }` so the item does
 * not render a second one.
 *
 * @param {Object}                    props
 * @param {?string}                   props.className                   Item className.
 * @param {boolean}                   props.isInherited                 Value is inherited at rest.
 * @param {boolean}                   props.hasLocalOverride            Local override is set.
 * @param {import('react').ReactNode} props.label                       Control label.
 * @param {?Function}                 props.onDeselect                  Reset handler.
 * @param {boolean}                   [props.showInheritanceAffordance] Render the indicator here (default true).
 * @param {boolean}                   [props.hasInlineEndToggle]        The control renders a 24x24 toggle (linked/unlink, units switch) at its inline-end; offset the affordance to sit just to its inline-start (default false).
 * @param {import('react').ReactNode} props.children                    The control.
 *
 * @return {Element} The panel item.
 */
export function InheritanceToolsPanelItem( {
	className,
	isInherited,
	hasLocalOverride,
	label,
	onDeselect,
	showInheritanceAffordance = true,
	hasInlineEndToggle = false,
	children,
	...rest
} ) {
	const showAffordance =
		showInheritanceAffordance && ( isInherited || hasLocalOverride );

	return (
		<ToolsPanelItem
			className={ className }
			label={ label }
			onDeselect={ onDeselect }
			{ ...rest }
		>
			{ children }
			{ showAffordance && (
				<div
					className={ clsx( 'global-styles-inheritance-affordance', {
						'global-styles-inheritance-affordance--offset-toggle':
							hasInlineEndToggle,
					} ) }
				>
					<InheritanceIndicatorButton
						hasLocalOverride={ hasLocalOverride }
						onResetToInherited={ onDeselect }
					/>
				</div>
			) }
		</ToolsPanelItem>
	);
}
