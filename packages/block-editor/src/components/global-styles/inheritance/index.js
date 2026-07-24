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
import { __ } from '@wordpress/i18n';

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
 * Returns props to spread onto a wrapping `<InheritanceToolsPanelItem>`. Only a
 * local override is marked with the diamond indicator; inheritance is the
 * unmarked default. `isInherited` is accepted and returned unchanged but no
 * longer produces any marker.
 *
 * @param {boolean}             isInherited      Control is inheriting at rest.
 * @param {boolean}             hasLocalOverride Local override is set.
 * @param {string|Array|Object} [baseClassName]  Optional className(s) to fold into the returned `className`.
 *
 * @return {{ className?: string, isInherited: boolean, hasLocalOverride: boolean }} Props for the wrapping `InheritanceToolsPanelItem`.
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
 * Renders the small filled diamond that marks a control holding a local override
 * of an inherited Global Styles value.
 *
 * @param {Object} props
 * @param {string} [props.className] Optional className for slot positioning.
 *
 * @return {Element} The override indicator.
 */
export function InheritanceOverrideIndicator( { className } ) {
	return (
		<Button
			size="small"
			label={ __( 'Overrides inherited styles' ) }
			className={ clsx(
				'global-styles-inheritance-indicator',
				className
			) }
			icon={
				<SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
			}
			onClick={ ( event ) => {
				// The button exists only to host the tooltip, so a click does
				// nothing.
				event.preventDefault();
				event.stopPropagation();
			} }
		/>
	);
}

/**
 * A `ToolsPanelItem` that renders the override indicator when its control
 * locally overrides an inherited Global Styles value. Inheritance is the
 * unmarked default; resetting is done through the `ToolsPanel` options menu.
 *
 * Controls with a bespoke layout (color, background image, shadow, duotone) pass
 * `showLocalOverrideActionsInLabel={ false }` and render the same
 * `InheritanceOverrideIndicator` in their own slot instead.
 *
 * @param {Object}                    props
 * @param {?string}                   props.className                         Item className.
 * @param {boolean}                   props.isInherited                       Value is inherited at rest. Accepted (and unused) so the `getInheritanceProps` spread does not leak onto the underlying `ToolsPanelItem`.
 * @param {boolean}                   props.hasLocalOverride                  Local override is set.
 * @param {import('react').ReactNode} props.label                             Control label.
 * @param {?Function}                 props.onDeselect                        Reset handler wired to the `ToolsPanel` options menu.
 * @param {boolean}                   [props.showLocalOverrideActionsInLabel] Render the override indicator here (default true).
 * @param {boolean}                   [props.hasInlineEndToggle]              The control renders a 24x24 toggle at its inline-end; offset the indicator to sit just to its inline-start (default false).
 * @param {import('react').ReactNode} props.children                          The control.
 *
 * @return {Element} The panel item.
 */
export function InheritanceToolsPanelItem( {
	className,
	// Destructured (and unused) so the `getInheritanceProps` spread does not
	// leak `isInherited` onto the underlying `ToolsPanelItem`.
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
