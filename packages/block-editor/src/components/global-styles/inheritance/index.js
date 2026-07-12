/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	Button,
	Icon as WCIcon,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { Tooltip } from '@wordpress/ui';
import { getBlockType } from '@wordpress/blocks';
import { reset as resetIcon } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

const INHERITANCE_TOOLTIP_LINE_SEPARATOR = '\n';

const BREADCRUMB_LABELS = {
	styles: __( 'Styles' ),
	elements: __( 'Elements' ),
	blocks: __( 'Blocks' ),
	variations: __( 'Variations' ),
};

function getBlockTitle( blockName ) {
	return getBlockType( blockName )?.title ?? blockName;
}

function getVariationTitle( variation, blockStyles, variationTitle ) {
	return (
		variationTitle ??
		blockStyles?.find( ( style ) => style.name === variation )?.label ??
		variation
	);
}

function getTranslatedBreadcrumb( source, blockStyles ) {
	const breadcrumb = source?.breadcrumb;
	const parts = breadcrumb
		.map( ( part ) => {
			if ( part === 'blockName' ) {
				return getBlockTitle( source.blockName );
			}
			if ( part === 'variationName' ) {
				return getVariationTitle(
					source.variation,
					blockStyles,
					source.variationTitle
				);
			}
			return BREADCRUMB_LABELS[ part ] ?? part;
		} )
		.filter( Boolean );
	return parts.join( ' > ' );
}

/**
 * Formats a source entry into user-facing tooltip text.
 *
 * @param {?Object} source      Source metadata.
 * @param {Array}   blockStyles Registered styles for the block type.
 * @return {string|undefined} Tooltip text, or undefined when no source exists.
 */
function getInheritanceTooltipText( source, blockStyles ) {
	const breadcrumb = source?.breadcrumb;
	if ( ! Array.isArray( breadcrumb ) || breadcrumb.length === 0 ) {
		return undefined;
	}
	return [
		__( 'Default inherited from:' ),
		getTranslatedBreadcrumb( source, blockStyles ),
	].join( INHERITANCE_TOOLTIP_LINE_SEPARATOR );
}

/**
 * Formats a source entry from a source map path.
 *
 * @param {?Object} sources     Source metadata keyed by dot path.
 * @param {string}  path        Dot path.
 * @param {Array}   blockStyles Registered styles for the block type.
 * @return {string|undefined} Tooltip text, or undefined when no source exists.
 */
export function getInheritanceTooltipTextByPath( sources, path, blockStyles ) {
	return getInheritanceTooltipText( sources?.[ path ], blockStyles );
}

/**
 * Formats a tooltip for a compound control. A shared source is used only when
 * all contributing paths resolve to the same breadcrumb; mixed sources receive
 * a conservative summary.
 *
 * @param {?Object} sources     Source metadata keyed by dot path.
 * @param {Array}   paths       Dot paths to inspect.
 * @param {Array}   blockStyles Registered styles for the block type.
 * @return {string|undefined} Tooltip text, or undefined when no source exists.
 */
export function getCommonInheritanceTooltipText( sources, paths, blockStyles ) {
	const sourceEntries = paths
		.map( ( path ) => sources?.[ path ] )
		.filter( Boolean );
	if ( sourceEntries.length === 0 ) {
		return undefined;
	}
	const firstBreadcrumb = sourceEntries[ 0 ].breadcrumb?.join( ' > ' );
	const hasCommonBreadcrumb = sourceEntries.every(
		( source ) => source.breadcrumb?.join( ' > ' ) === firstBreadcrumb
	);
	if ( hasCommonBreadcrumb ) {
		return getInheritanceTooltipText( sourceEntries[ 0 ], blockStyles );
	}
	return __( 'Default inherited from multiple Styles sources' );
}

/**
 * Returns props to spread onto a wrapping `<InheritanceToolsPanelItem>` so its
 * descendant label picks up the inherited-from-Global-Styles visual treatment.
 *
 * When `isInherited` is true without a local override, the descendant label
 * text gets the inherited-from-Global-Styles treatment (dotted underline). When
 * `hasLocalOverride` is true, a reset dot is rendered next to the control. The
 * two are mutually exclusive; if both are passed, only the override wins.
 *
 * `showIndicators` gates the whole feature: when false (outside the inspector)
 * neither the treatment nor the override state is applied, but any
 * `baseClassName` still passes through so layout classes survive. The returned
 * `isInherited` is likewise false, so callers can gate the breadcrumb tooltip
 * on it and it can't drift from the label treatment.
 *
 * @param {boolean}             showIndicators   Whether inheritance indicators
 *                                               are enabled for the panel.
 * @param {boolean}             isInherited      Control is inheriting at rest.
 * @param {boolean}             hasLocalOverride Local override is set AND there
 *                                               is an inherited value being
 *                                               overridden.
 * @param {string|Array|Object} [baseClassName]  Optional className(s) to fold
 *                                               into the returned `className`.
 *
 * @return {{ className?: string, isInherited: boolean, hasLocalOverride: boolean }} Props for the wrapping
 *                                  `InheritanceToolsPanelItem`.
 */
export function getInheritanceProps(
	showIndicators,
	isInherited,
	hasLocalOverride,
	baseClassName
) {
	const inheritedOnly =
		showIndicators && !! isInherited && ! hasLocalOverride;
	const hasOverride = showIndicators && !! hasLocalOverride;
	const className = clsx( baseClassName, {
		'is-inherited-from-global-styles': inheritedOnly,
		'has-local-override-from-global-styles': hasOverride,
	} );
	return {
		...( className ? { className } : {} ),
		isInherited: inheritedOnly,
		hasLocalOverride: hasOverride,
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
 * Wraps label content in the inherited-from breadcrumb tooltip using the
 * `@wordpress/ui` `Tooltip` — the same primitive the native `labelTooltip` prop
 * renders through (see `LabelWithTooltip` in `@wordpress/components`), so both
 * tooltip paths look and behave identically.
 *
 * For controls whose label is not rendered by a `BaseControl`/`InputControl`
 * (color name, background image title, duotone), the native `labelTooltip`
 * prop can't reach the label text, so it is wrapped directly here instead. When
 * `labelTooltip` is falsy the children are returned unwrapped.
 *
 * @param {Object}                    props
 * @param {?string}                   props.labelTooltip Breadcrumb tooltip text.
 * @param {import('react').ReactNode} props.children     Label content to wrap.
 *
 * @return {import('react').ReactNode} Wrapped (or bare) label content.
 */
export function InheritanceLabelTooltip( { labelTooltip, children } ) {
	if ( ! labelTooltip ) {
		return children;
	}
	return (
		<Tooltip.Root>
			<Tooltip.Trigger
				render={
					<span className="global-styles-inheritance-tooltip-anchor">
						{ children }
					</span>
				}
			/>
			<Tooltip.Popup className="global-styles-inheritance-tooltip-content">
				{ labelTooltip
					.split( INHERITANCE_TOOLTIP_LINE_SEPARATOR )
					.map( ( line, index ) => (
						<span
							key={ index }
							className="global-styles-inheritance-tooltip-content__line"
						>
							{ line }
						</span>
					) ) }
			</Tooltip.Popup>
		</Tooltip.Root>
	);
}

/**
 * A `ToolsPanelItem` that reflects whether its control's value is inherited
 * from Global Styles or locally overridden. The two states are mutually
 * exclusive.
 *
 * - Inherited: the control label receives the inherited-from-Global-Styles
 *   treatment (dotted underline) via the `is-inherited-from-global-styles`
 *   class applied through `getInheritanceProps`. The breadcrumb tooltip
 *   pointing at the originating Global Styles source is rendered by the
 *   control itself via its native `labelTooltip` prop, which the panels pass
 *   in directly — this item is not involved in the tooltip. No dot is shown.
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
 * @param {boolean}                   props.isInherited                       Value is inherited at rest. Applies the label treatment via `className` (through `getInheritanceProps`).
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
	// `isInherited`/`hasLocalOverride` are consumed here, not forwarded onto
	// `ToolsPanelItem`: the label treatment and reset dot are driven entirely
	// by `className` and `hasLocalOverride`, so passing them through would leak
	// unknown attributes onto the DOM.
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
