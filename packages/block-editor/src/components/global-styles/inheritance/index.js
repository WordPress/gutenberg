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
import {
	createPortal,
	useLayoutEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { getBlockType } from '@wordpress/blocks';
import { reset as resetIcon } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

const GENERIC_INHERITANCE_TOOLTIP_TEXT = __( 'Default inherited from:' );
const INHERITANCE_TOOLTIP_LINE_SEPARATOR = '\n';

// Label nodes the portal may adorn with the inherited-value tooltip. Shared by
// the initial query and the `MutationObserver` re-query so the two never drift.
// Kept in lockstep with the label targets the inheritance SCSS treats: most
// controls expose `.components-base-control__label`, but bare
// `UnitControl`/`NumberControl` controls (Line height, Letter spacing, Columns,
// unit-based dimensions) expose `.components-input-control__label`; the color,
// background image, and duotone controls use their own label classes.
const LABEL_TARGET_SELECTOR =
	'.components-base-control__label, .components-input-control__label, .block-editor-panel-color-gradient-settings__color-name, .block-editor-global-styles-background-panel__inspector-media-replace-title, .block-editor-panel-duotone-settings__label';

// Class of the stable wrapper this component owns and re-parents between
// labels; the portal renders into it.
const PORTAL_CONTAINER_CLASS = 'global-styles-inheritance-portal';

// Classes owned by the nodes this component portals into the label. Mutations
// that only touch these must not retrigger the observer's re-query, otherwise
// the injection feeds back into the observer.
const PORTAL_OWNED_CLASSES = [
	PORTAL_CONTAINER_CLASS,
	'global-styles-inheritance-tooltip-anchor',
];

function isPortalOwnedNode( node ) {
	return (
		node?.nodeType === window.Node.ELEMENT_NODE &&
		PORTAL_OWNED_CLASSES.some( ( className ) =>
			node.classList.contains( className )
		)
	);
}

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

function InheritanceTooltipContent( { text } ) {
	return text
		.split( INHERITANCE_TOOLTIP_LINE_SEPARATOR )
		.map( ( line, index ) => (
			<span
				key={ `${ line }-${ index }` }
				className="global-styles-inheritance-tooltip-content__line"
			>
				{ line }
			</span>
		) );
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
 * Helper that portals the inherited-value tooltip into the panel item's
 * visible label so the tooltip anchors on the label text rather than
 * affecting the panel item's control layout.
 *
 * Mounts a hidden sentinel `<span>` whose `parentElement` is the
 * `ToolsPanelItem` content wrapper. From the sentinel we run a
 * `querySelector` for the supported label selectors and adopt the first
 * match.
 *
 * Rather than portaling directly into the label — which is owned by the
 * inner control's React tree and may be swapped out on re-render (e.g. when
 * setting a new background image), causing `removeChild` errors during
 * reconciliation — we create our own stable `<span>` and imperatively
 * re-parent it into the current label. React only ever manages the inside
 * of that span, so it never conflicts with the label owner's DOM updates.
 * The span uses `display: contents` so it adds no box of its own.
 *
 * A `MutationObserver` re-attaches the container when the inner control
 * replaces its own label node on re-render; the observer skips this
 * component's own portaled nodes to avoid a feedback loop.
 *
 * @param {Object} props
 * @param {string} props.inheritanceTooltipText Tooltip text for inherited
 *                                              controls.
 * @param {string} props.label                  Pristine label text used as the
 *                                              tooltip anchor. Sourced from the
 *                                              `label` prop rather than the
 *                                              mutated DOM so it never compounds.
 *
 * @return {Element} The sentinel span plus portaled tooltip.
 */
function PortaledInheritanceControls( { inheritanceTooltipText, label } ) {
	const sentinelRef = useRef( null );
	const portalNodeRef = useRef( null );
	const [ portalNode, setPortalNode ] = useState( null );

	useLayoutEffect( () => {
		const sentinel = sentinelRef.current;
		if ( ! sentinel ) {
			return;
		}
		// `parentElement` is the `ToolsPanelItem` content wrapper. Scope
		// the lookup so we don't match label elements outside this
		// panel item.
		const scope = sentinel.parentElement;
		if ( ! scope ) {
			return;
		}

		// Our own container. `display: contents` keeps it layout-neutral so
		// the anchor behaves as a direct child of the label.
		if ( ! portalNodeRef.current ) {
			const node = sentinel.ownerDocument.createElement( 'span' );
			node.className = PORTAL_CONTAINER_CLASS;
			node.style.display = 'contents';
			portalNodeRef.current = node;
		}
		const portal = portalNodeRef.current;

		// Forward clicks on the tooltip anchor overlay to the control it
		// labels. The anchor is portaled, so React routes its synthetic
		// events through the portal's React parent tree rather than the
		// DOM-ancestor control; for toggle-based controls (color, background
		// image) the overlay would otherwise swallow the click and the toggle
		// would never open. A native listener re-dispatches the click on the
		// nearest ancestor button. Plain-label controls have no ancestor
		// button, so this is a no-op for them.
		const forwardAnchorClick = ( event ) => {
			if (
				! event.target.closest(
					'.global-styles-inheritance-tooltip-anchor'
				)
			) {
				return;
			}
			const button = portal.closest( 'button' );
			button?.click();
		};
		portal.addEventListener( 'click', forwardAnchorClick );

		// Adopt the current label (re-parenting our stable container so React
		// never has to unmount the portal across label swaps).
		const syncTarget = () => {
			// Idempotent guard: if our container is already attached to a
			// valid label, leave it in place. Re-parenting the node while
			// the inner control is mid-interaction — e.g. opening/closing the
			// background image dropdown or switching the image — races with
			// that control's own click/focus handling and makes the dropdown
			// fail to open or close reliably. Only move when the label node
			// has actually been detached or replaced.
			if (
				portal.isConnected &&
				portal.parentElement?.matches( LABEL_TARGET_SELECTOR )
			) {
				return;
			}
			const target = scope.querySelector( LABEL_TARGET_SELECTOR );
			if ( ! target ) {
				portal.remove();
				setPortalNode( null );
				return;
			}
			target.appendChild( portal );
			setPortalNode( portal );
		};
		syncTarget();

		// Watch for label DOM replacement when the inner control
		// re-renders (e.g. on value change). Only observe direct
		// child changes within this panel item — cheap and bounded.
		const observer = new window.MutationObserver( ( mutations ) => {
			// Skip mutations caused solely by this component's own
			// portaled nodes to avoid an observer feedback loop.
			const hasRelevantMutation = mutations.some( ( mutation ) =>
				[ ...mutation.addedNodes, ...mutation.removedNodes ].some(
					( node ) => ! isPortalOwnedNode( node )
				)
			);
			if ( ! hasRelevantMutation ) {
				return;
			}
			syncTarget();
		} );
		observer.observe( scope, { childList: true, subtree: true } );
		return () => {
			observer.disconnect();
			portal.removeEventListener( 'click', forwardAnchorClick );
			portal.remove();
			portalNodeRef.current = null;
		};
	}, [] );

	return (
		<>
			<span
				ref={ sentinelRef }
				aria-hidden="true"
				style={ { display: 'none' } }
			/>
			{ portalNode &&
				createPortal(
					<Tooltip.Root>
						<Tooltip.Trigger
							render={
								<span className="global-styles-inheritance-tooltip-anchor">
									<span className="global-styles-inheritance-tooltip-anchor__text">
										{ label }
									</span>
								</span>
							}
						/>
						<Tooltip.Popup>
							<InheritanceTooltipContent
								text={
									inheritanceTooltipText ??
									GENERIC_INHERITANCE_TOOLTIP_TEXT
								}
							/>
						</Tooltip.Popup>
					</Tooltip.Root>,
					portalNode
				) }
		</>
	);
}

/**
 * A `ToolsPanelItem` that reflects whether its control's value is inherited
 * from Global Styles or locally overridden. The two states are mutually
 * exclusive.
 *
 * - Inherited: the control label receives the inherited-from-Global-Styles
 *   treatment (dotted underline) via the `is-inherited-from-global-styles`
 *   class applied through `getInheritanceProps`. When an
 *   `inheritanceTooltipText` is supplied, a breadcrumb tooltip pointing at the
 *   originating Global Styles source is portaled onto the label. No dot is
 *   shown.
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
 * @param {boolean}                   props.isInherited                       Value is inherited at rest. Gates the breadcrumb tooltip and (via `getInheritanceProps`) the label treatment applied through `className`.
 * @param {boolean}                   props.hasLocalOverride                  Local override is set.
 * @param {import('react').ReactNode} props.label                             Control label.
 * @param {?Function}                 props.onDeselect                        Reset handler.
 * @param {boolean}                   [props.showLocalOverrideActionsInLabel] Render the reset dot here (default true).
 * @param {boolean}                   [props.hasInlineEndToggle]              The control renders a 24x24 toggle (linked/unlink, units switch) at its inline-end; offset the reset dot to sit just to its inline-start (default false).
 * @param {?string}                   [props.inheritanceTooltipText]          Breadcrumb tooltip text describing the Global Styles source the value is inherited from. Only rendered in the block inspector, where sources are provided.
 * @param {import('react').ReactNode} props.children                          The control.
 *
 * @return {Element} The panel item.
 */
export function InheritanceToolsPanelItem( {
	className,
	// `isInherited` gates the breadcrumb tooltip below. It is intentionally
	// not forwarded onto the underlying `ToolsPanelItem`; the inherited label
	// treatment is applied purely via `className`
	// (`is-inherited-from-global-styles`).
	isInherited,
	hasLocalOverride,
	label,
	onDeselect,
	showLocalOverrideActionsInLabel = true,
	hasInlineEndToggle = false,
	inheritanceTooltipText,
	children,
	...rest
} ) {
	const showResetAffordance =
		hasLocalOverride && showLocalOverrideActionsInLabel;
	// The breadcrumb tooltip is inspector-only: Global Styles screens render
	// these panels without an inheritance provider, so `inheritanceTooltipText`
	// is undefined there and no tooltip is portaled onto the label.
	const showInheritedTooltip = isInherited && !! inheritanceTooltipText;

	return (
		<ToolsPanelItem
			className={ className }
			label={ label }
			onDeselect={ onDeselect }
			{ ...rest }
		>
			{ children }
			{ showInheritedTooltip && (
				<PortaledInheritanceControls
					label={ label }
					inheritanceTooltipText={ inheritanceTooltipText }
				/>
			) }
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
