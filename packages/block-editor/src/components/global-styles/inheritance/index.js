/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	Rect,
	SVG,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Tooltip } from '@wordpress/ui';
import { getBlockType, store as blocksStore } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';

/**
 * Accessible name / tooltip shown when a control has no resolvable inherited
 * source (defensive: a local override normally implies an inherited value).
 *
 * @type {string}
 */
const OVERRIDE_LABEL = __( 'Overrides inherited styles' );

// Separator between breadcrumb parts (e.g. `Styles › Blocks › Group`).
const BREADCRUMB_SEPARATOR = ' › ';

// Fixed breadcrumb parts, translated. The root `styles` node is intentionally
// omitted: it duplicates the "inherited styles" wording in the tooltip and adds
// no locating information (see `getTranslatedBreadcrumb`). Block/variation
// titles are resolved separately from the source's `blockName`/`variation`
// slugs.
const BREADCRUMB_LABELS = {
	elements: __( 'Elements' ),
	blocks: __( 'Blocks' ),
	variations: __( 'Variations' ),
};

function getBlockTitle( blockName ) {
	return getBlockType( blockName )?.title ?? blockName;
}

function getVariationTitle( variation, blockStyles ) {
	return (
		blockStyles?.find( ( style ) => style.name === variation )?.label ??
		variation
	);
}

/**
 * Translates a source's raw breadcrumb part identifiers into a ` › `-joined
 * title path (e.g. `Styles › Blocks › Group › Variations › Subtitle`).
 *
 * @param {?Object} source      Source-map entry (`{ breadcrumb, blockName, variation }`).
 * @param {?Array}  blockStyles Registered styles for the block type (for variation titles).
 * @return {string|undefined} The breadcrumb path, or undefined when there is no source.
 */
export function getTranslatedBreadcrumb( source, blockStyles ) {
	const breadcrumb = source?.breadcrumb;
	if ( ! Array.isArray( breadcrumb ) || breadcrumb.length === 0 ) {
		return undefined;
	}
	const parts = breadcrumb
		// Drop the root `styles` node — it duplicates "inherited styles" in the
		// tooltip. A root-only source (just `[ 'styles' ]`) therefore yields no
		// path, and the indicator falls back to the bare label.
		.filter( ( part ) => part !== 'styles' )
		.map( ( part ) => {
			if ( part === 'blockName' ) {
				return getBlockTitle( source.blockName );
			}
			if ( part === 'variationName' ) {
				return getVariationTitle( source.variation, blockStyles );
			}
			return BREADCRUMB_LABELS[ part ] ?? part;
		} )
		.filter( Boolean );
	if ( parts.length === 0 ) {
		return undefined;
	}
	return parts.join( BREADCRUMB_SEPARATOR );
}

/**
 * Builds the full override tooltip for a single source:
 * `Overrides inherited styles from <breadcrumb>`.
 *
 * @param {?Object} source      Source-map entry.
 * @param {?Array}  blockStyles Registered styles for the block type.
 * @return {string|undefined} The tooltip text, or undefined when there is no source.
 */
export function getOverrideTooltipText( source, blockStyles ) {
	const breadcrumb = getTranslatedBreadcrumb( source, blockStyles );
	if ( ! breadcrumb ) {
		return undefined;
	}
	return sprintf(
		/* translators: %s: Global Styles breadcrumb path, e.g. "Styles › Blocks › Group". */
		__( 'Overrides inherited styles from %s' ),
		breadcrumb
	);
}

// Identity key for a source's breadcrumb, so compound controls can tell whether
// every contributing value resolves to the same Global Styles source.
function getBreadcrumbKey( source ) {
	return [
		...( source?.breadcrumb ?? [] ),
		source?.blockName ?? '',
		source?.variation ?? '',
	].join( '' );
}

/**
 * Builds the override tooltip for a control backed by one or more source paths.
 * A single shared breadcrumb is used when every contributing source matches;
 * mixed sources fall back to a conservative summary.
 *
 * @param {?Array} sources     Source-map entries for the control's paths (may contain holes).
 * @param {?Array} blockStyles Registered styles for the block type.
 * @return {string|undefined} The tooltip text, or undefined when there is no source.
 */
export function getCommonOverrideTooltipText( sources, blockStyles ) {
	const entries = ( sources ?? [] ).filter( Boolean );
	if ( entries.length === 0 ) {
		return undefined;
	}
	const firstKey = getBreadcrumbKey( entries[ 0 ] );
	const allMatch = entries.every(
		( source ) => getBreadcrumbKey( source ) === firstKey
	);
	if ( allMatch ) {
		return getOverrideTooltipText( entries[ 0 ], blockStyles );
	}
	return __( 'Overrides inherited styles from multiple sources' );
}

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
 * When `overrideSources` (the source-map entries for the control's inherited
 * paths) resolves to a breadcrumb, the tooltip reads
 * `Overrides inherited styles from <path>`; otherwise it falls back to the bare
 * `Overrides inherited styles`. Global Styles screens pass no sources, so no
 * breadcrumb is shown there.
 *
 * @param {Object} props
 * @param {string} [props.className]       Optional className for slot positioning.
 * @param {?Array} [props.overrideSources] Source-map entries for the control's inherited paths.
 *
 * @return {Element} The override indicator.
 */
export function InheritanceOverrideIndicator( { className, overrideSources } ) {
	const blockName = overrideSources?.find( Boolean )?.blockName;
	const blockStyles = useSelect(
		( select ) =>
			blockName
				? select( blocksStore ).getBlockStyles( blockName )
				: null,
		[ blockName ]
	);
	const label =
		getCommonOverrideTooltipText( overrideSources, blockStyles ) ??
		OVERRIDE_LABEL;

	return (
		<Tooltip.Root>
			<Tooltip.Trigger
				render={
					// Not interactive: it is focusable only so keyboard users
					// can reach the tooltip.
					<span
						role="img"
						aria-label={ label }
						tabIndex={ 0 }
						className={ clsx(
							'global-styles-inheritance-indicator',
							className
						) }
					>
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
					</span>
				}
			/>
			<Tooltip.Popup>{ label }</Tooltip.Popup>
		</Tooltip.Root>
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
 * @param {?Array}                    [props.overrideSources]                 Source-map entries for the control's inherited paths, used to build the override tooltip breadcrumb.
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
	overrideSources,
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
					<InheritanceOverrideIndicator
						overrideSources={ overrideSources }
					/>
				</div>
			) }
		</ToolsPanelItem>
	);
}
