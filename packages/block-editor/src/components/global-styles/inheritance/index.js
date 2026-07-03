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
// The background image control's label uses its own class, matching the same
// node the inheritance SCSS already treats as a label target.
const LABEL_TARGET_SELECTOR =
	'.components-base-control__label, .block-editor-panel-color-gradient-settings__color-name, .block-editor-global-styles-background-panel__inspector-media-replace-title';

// Class of the stable wrapper this component owns and re-parents between
// labels; the portal renders into it.
const PORTAL_CONTAINER_CLASS = 'global-styles-inheritance-portal';

// Classes owned by the nodes this component portals into the label. Mutations
// that only touch these must not retrigger the observer's re-query, otherwise
// the injection feeds back into the observer.
const PORTAL_OWNED_CLASSES = [
	PORTAL_CONTAINER_CLASS,
	'global-styles-inheritance-tooltip-anchor',
	'has-local-override-from-global-styles__reset',
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
 * label text is tinted and the wrapped control receives the standard
 * "Default inherited from:" tooltip.
 *
 * When `hasLocalOverride` is true, a small dropdown trigger is portaled
 * into the visible label and exposes a "Reset to inherited value" action.
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
 * Helper that portals inheritance UI into the panel item's visible
 * label so the UI sits inline with the label text rather than affecting
 * the panel item's control layout.
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
 * @param {Object}   props
 * @param {Function} props.onResetToInherited     Reset handler forwarded to the
 *                                                reset button.
 * @param {boolean}  props.isInherited            Whether to attach the inherited
 *                                                tooltip to the label.
 * @param {string}   props.inheritanceTooltipText Tooltip text for inherited
 *                                                controls.
 * @param {string}   props.label                  Pristine label text used as the
 *                                                tooltip anchor. Sourced from the
 *                                                `label` prop rather than the
 *                                                mutated DOM so it never compounds.
 *
 * @return {Element} The sentinel span plus portaled inheritance UI.
 */
function PortaledInheritanceControls( {
	onResetToInherited,
	isInherited,
	inheritanceTooltipText,
	label,
} ) {
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
		// the anchor/reset behave as direct children of the label.
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
					<>
						{ isInherited && (
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
							</Tooltip.Root>
						) }
						{ onResetToInherited && (
							<InheritanceResetButton
								onResetToInherited={ onResetToInherited }
							/>
						) }
					</>,
					portalNode
				) }
		</>
	);
}

export function InheritanceToolsPanelItem( {
	className,
	isInherited,
	hasLocalOverride,
	label,
	onDeselect,
	showLocalOverrideActionsInLabel = true,
	inheritanceTooltipText,
	children,
	...rest
} ) {
	const showLocalOverrideActions =
		hasLocalOverride && showLocalOverrideActionsInLabel;
	return (
		<ToolsPanelItem
			className={ className }
			label={ label }
			onDeselect={ onDeselect }
			{ ...rest }
		>
			{ children }
			{ ( isInherited || hasLocalOverride ) && (
				<PortaledInheritanceControls
					label={ label }
					inheritanceTooltipText={ inheritanceTooltipText }
					isInherited={ isInherited }
					onResetToInherited={
						showLocalOverrideActions ? onDeselect : undefined
					}
				/>
			) }
		</ToolsPanelItem>
	);
}
