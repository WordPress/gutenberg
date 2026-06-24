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
	MenuGroup,
	MenuItem,
	NavigableMenu,
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
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { usePushDestination } from '../inherited-value-context';

const GENERIC_INHERITANCE_TOOLTIP_TEXT = __( 'Default inherited from:' );
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
 * Builds the help text shown under the "Make default" action, naming the Global
 * Styles location the override will be written to.
 *
 * The breadcrumb mirrors the push destination (block, plus the active variation
 * when one is being edited) so the copy stays in lockstep with where the value
 * actually lands. Returns undefined when there is no block context to describe.
 *
 * @param {Object}  destination              Push destination context.
 * @param {?string} destination.blockName    Block name (e.g. `core/heading`).
 * @param {?string} destination.ownVariation Active block style variation slug.
 * @param {Array}   destination.blockStyles  Registered styles for the block.
 * @return {string|undefined} Help text, or undefined when no block context exists.
 */
function getPushDestinationHelpText( {
	blockName,
	ownVariation,
	blockStyles,
} ) {
	if ( ! blockName ) {
		return undefined;
	}
	const breadcrumb = ownVariation
		? [ 'styles', 'blocks', 'blockName', 'variations', 'variationName' ]
		: [ 'styles', 'blocks', 'blockName' ];
	const path = getTranslatedBreadcrumb(
		{ breadcrumb, blockName, variation: ownVariation },
		blockStyles
	);
	return sprintf(
		/* translators: %s: Global Styles location the default is updated, e.g. "Styles > Blocks > Heading". */
		__( 'Update default for %s' ),
		path
	);
}

/**
 * Formats a source entry into user-facing tooltip text.
 *
 * @param {?Object} source      Source metadata.
 * @param {Array}   blockStyles Registered styles for the block type.
 * @return {string|undefined} Tooltip text, or undefined when no source exists.
 */
export function getInheritanceTooltipText( source, blockStyles ) {
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
 * Renders the small blue-dot toggle and its dropdown menu. Used by
 * `<InheritanceToolsPanelItem>` and not exported standalone.
 *
 * Built on the lower-level `<Dropdown>` rather than `<DropdownMenu>`
 * so we have complete control over the trigger markup. The trigger
 * is a `<Button>` with the dot `<span>` as its only child — no
 * `icon` prop is set, so `Button` does not interfere with the
 * rendered children.
 *
 * @param {Object}    props
 * @param {Function}  props.onResetToInherited     Reset handler.
 * @param {?Function} [props.onPushToGlobalStyles] Push-to-Global-Styles handler.
 *                                                 When provided, a "Make default"
 *                                                 action is added to the menu.
 * @param {string}    [props.pushHelpText]         Secondary text describing the
 *                                                 Global Styles location the
 *                                                 "Make default" action updates.
 * @param {string}    [props.className]            Optional className for the
 *                                                 dropdown wrapper.
 *
 * @return {Element} The dot menu.
 */
export function InheritanceActionsDropdown( {
	onResetToInherited,
	onPushToGlobalStyles,
	pushHelpText,
	className,
} ) {
	return (
		<Dropdown
			className={ clsx(
				'has-local-override-from-global-styles__menu',
				className
			) }
			contentClassName="has-local-override-from-global-styles__menu-content"
			popoverProps={ { placement: 'bottom-start' } }
			renderToggle={ ( { isOpen, onToggle } ) => (
				// Intentionally small (14×14) circular trigger; exempt
				// from the 40px default-size enforcement rule.
				// eslint-disable-next-line @wordpress/components-no-missing-40px-size-prop
				<Button
					__next40pxDefaultSize={ false }
					aria-haspopup="menu"
					aria-expanded={ isOpen }
					aria-label={ __( 'Local override options' ) }
					className="has-local-override-from-global-styles__toggle"
					onClick={ ( event ) => {
						// Prevent the click from reaching any wrapping
						// `<label htmlFor>` association, which would
						// otherwise focus/activate the inner control.
						event.preventDefault();
						event.stopPropagation();
						onToggle();
					} }
				>
					<span
						aria-hidden="true"
						className="has-local-override-from-global-styles__dot"
					/>
				</Button>
			) }
			renderContent={ ( { onClose } ) => (
				<NavigableMenu role="menu">
					<MenuGroup>
						<MenuItem
							onClick={ () => {
								onClose();
								onResetToInherited?.();
							} }
						>
							{ __( 'Reset to inherited value' ) }
						</MenuItem>
						{ onPushToGlobalStyles && (
							<MenuItem
								info={ pushHelpText }
								onClick={ () => {
									onClose();
									onPushToGlobalStyles();
								} }
							>
								{ __( 'Make default' ) }
							</MenuItem>
						) }
					</MenuGroup>
				</NavigableMenu>
			) }
		/>
	);
}

/**
 * Helper that portals inheritance UI into the panel item's visible
 * label so the UI sits inline with the label text rather than affecting
 * the panel item's control layout.
 *
 * Mounts a hidden sentinel `<span>` whose `parentElement` is the
 * `ToolsPanelItem` content wrapper. From the sentinel we run a
 * `querySelector` for the supported label selectors and create a
 * portal targeting the first match. The label DOM node may be
 * replaced by the inner control on re-render, so we re-query on
 * every render and only call `setState` when the target changes
 * (referential equality through `Object.is`, so React skips the
 * re-render when stable).
 *
 * @param {Object}    props
 * @param {Function}  props.onResetToInherited     Reset handler forwarded to the
 *                                                 dot menu.
 * @param {?Function} props.onPushToGlobalStyles   Push-to-Global-Styles handler
 *                                                 forwarded to the dot menu.
 * @param {boolean}   props.isInherited            Whether to attach the inherited
 *                                                 tooltip to the label.
 * @param {string}    props.inheritanceTooltipText Tooltip text for inherited
 *                                                 controls.
 *
 * @return {Element} The sentinel span plus portaled inheritance UI.
 */
function PortaledInheritanceControls( {
	onResetToInherited,
	onPushToGlobalStyles,
	isInherited,
	inheritanceTooltipText,
} ) {
	const sentinelRef = useRef( null );
	const [ labelEl, setLabelEl ] = useState( null );
	const pushDestination = usePushDestination();
	const pushHelpText = onPushToGlobalStyles
		? getPushDestinationHelpText( pushDestination )
		: undefined;

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
		const target = scope.querySelector(
			'.components-base-control__label, .block-editor-panel-color-gradient-settings__color-name'
		);
		setLabelEl( target ?? null );

		// Watch for label DOM replacement when the inner control
		// re-renders (e.g. on value change). Only observe direct
		// child changes within this panel item — cheap and bounded.
		const observer = new window.MutationObserver( () => {
			const next = scope.querySelector(
				'.components-base-control__label, .block-editor-panel-color-gradient-settings__color-name'
			);
			setLabelEl( ( prev ) => ( prev === next ? prev : next ?? null ) );
		} );
		observer.observe( scope, { childList: true, subtree: true } );
		return () => observer.disconnect();
	}, [] );

	return (
		<>
			<span
				ref={ sentinelRef }
				aria-hidden="true"
				style={ { display: 'none' } }
			/>
			{ labelEl &&
				createPortal(
					<>
						{ isInherited && (
							<Tooltip.Root>
								<Tooltip.Trigger
									render={
										<span className="global-styles-inheritance-tooltip-anchor">
											<span className="global-styles-inheritance-tooltip-anchor__text">
												{ labelEl.textContent }
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
							<InheritanceActionsDropdown
								onResetToInherited={ onResetToInherited }
								onPushToGlobalStyles={ onPushToGlobalStyles }
								pushHelpText={ pushHelpText }
							/>
						) }
					</>,
					labelEl
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
	onPushToGlobalStyles,
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
					inheritanceTooltipText={ inheritanceTooltipText }
					isInherited={ isInherited }
					onResetToInherited={
						showLocalOverrideActions ? onDeselect : undefined
					}
					onPushToGlobalStyles={
						showLocalOverrideActions
							? onPushToGlobalStyles
							: undefined
					}
				/>
			) }
		</ToolsPanelItem>
	);
}
