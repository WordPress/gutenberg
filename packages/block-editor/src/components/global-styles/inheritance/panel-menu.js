/**
 * WordPress dependencies
 */
import { __experimentalToolsPanel as ToolsPanel } from '@wordpress/components';
import { VisuallyHidden } from '@wordpress/ui';
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useReducer,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useControlCascade } from '../style-origins/use-cascade';
import { isGlobalStylesInheritanceEnabled } from './is-enabled';

/**
 * Panel-level home for Global Styles inheritance.
 *
 * The alternative explored here is the per-control indicator: a marker sitting
 * in the control's own row. That placement has to find room in rows that vary a
 * lot — labelled inputs, `ItemGroup` rows whose whole surface is a flyout
 * toggle, controls that already occupy their inline-end with a units switch or
 * a link/unlink button — and it has to stay reachable by tap on mobile, where
 * hover-revealed affordances do not exist. It also only ever had room for one
 * bit of information: that the value was overridden, not what it overrode.
 *
 * This module puts the answer in the options ("ellipsis") menu that every style
 * panel already has, under the control it belongs to. That menu already lists
 * every control by name, and already offers each one a `Reset` — which for a
 * control holding a local value over an inherited one is exactly the "put it
 * back" action. So nothing new is added to it: the cascade slots in underneath
 * the row that already exists, and the existing reset does the work.
 *
 * Nothing at rest, deliberately. No indicator on the control rows, none on the
 * panel's menu toggle. The trade is discoverability — nothing announces that a
 * block is overriding anything, and you find out by opening the menu. That is
 * the point rather than an omission: every attempt at an at-rest marker had to
 * answer "where does it go on a row that is entirely a flyout toggle, and how
 * is it tapped on mobile", and a placement with no marker does not have to.
 */

/**
 * Exported so `BlockSupportSlotContainer` can forward it across the
 * `bubblesVirtually` slot boundary, where the block inspector's panel items
 * render in a different React tree from the panel that collects them. The
 * `ToolsPanelContext` is forwarded there for the same reason.
 */
export const InheritanceMenuContext = createContext( undefined );

// Stable identity so a panel with nothing overridden never produces a new state
// object and re-renders for nothing.
const EMPTY_CASCADES = {};

function cascadesReducer( state, action ) {
	switch ( action.type ) {
		case 'SET': {
			const existing = state[ action.label ];
			if ( existing && existing.token !== action.token ) {
				// Another item already owns this label. Can happen while the
				// inspector swaps between blocks exposing the same control.
				return state;
			}
			return {
				...state,
				[ action.label ]: {
					token: action.token,
					cascade: action.cascade,
				},
			};
		}
		case 'UNSET': {
			// Matched on the token as well as the label: when the inspector
			// switches between blocks that expose the same control, the
			// outgoing item's cleanup can run after the incoming item has
			// registered, and an unqualified removal would drop the new entry.
			if ( state[ action.label ]?.token !== action.token ) {
				return state;
			}
			const next = { ...state };
			delete next[ action.label ];
			return next;
		}
		default:
			return state;
	}
}

/**
 * Collects, for one style panel, the cascade behind each control that holds a
 * local value shadowing an inherited one, keyed by the control's label — the
 * same key `ToolsPanel` builds its own menu items from.
 *
 * @param {Object}                    props
 * @param {import('react').ReactNode} props.children
 *
 * @return {Element} The provider.
 */
export function InheritanceMenuProvider( { children } ) {
	const [ cascades, dispatch ] = useReducer(
		cascadesReducer,
		EMPTY_CASCADES
	);

	const setCascade = useCallback( ( label, token, cascade ) => {
		dispatch( { type: 'SET', label, token, cascade } );
	}, [] );

	const unsetCascade = useCallback( ( label, token ) => {
		dispatch( { type: 'UNSET', label, token } );
	}, [] );

	const value = useMemo(
		() => ( { cascades, setCascade, unsetCascade } ),
		[ cascades, setCascade, unsetCascade ]
	);

	return (
		<InheritanceMenuContext.Provider value={ value }>
			{ children }
		</InheritanceMenuContext.Provider>
	);
}

/**
 * Publishes a control's cascade to its panel's options menu. A no-op outside an
 * `InheritanceMenuProvider`, so controls can call it unconditionally.
 *
 * @param {?string}   label            The control's label, which is also the key
 *                                     `ToolsPanel` uses for its menu items.
 * @param {boolean}   hasLocalOverride Whether the control holds a local value
 *                                     shadowing an inherited one.
 * @param {?string[]} [stylePaths]     Dot-paths the control writes, used to look
 *                                     up the cascade behind it.
 */
export function useInheritanceMenuItem( label, hasLocalOverride, stylePaths ) {
	const context = useContext( InheritanceMenuContext );
	const setCascade = context?.setCascade;
	const unsetCascade = context?.unsetCascade;

	// Identifies this control instance for the lifetime of the component, so a
	// departing item cannot clear an entry a newly-mounted item has just made
	// under the same label.
	const token = useMemo( () => ( {} ), [] );

	// Only resolved while the control actually overrides something: an
	// inheriting control has nothing to describe, and this is the one
	// non-trivial computation on the path.
	const cascade = useControlCascade(
		hasLocalOverride && context ? stylePaths : undefined
	);
	// Dispatching on a value signature rather than array identity keeps a
	// keystroke that leaves the cascade unchanged from re-rendering the panel.
	const cascadeSignature = JSON.stringify( cascade );

	useEffect( () => {
		// `ToolsPanel` keys its own menu items by label, so a non-string label
		// has no menu row for the cascade to sit under.
		if ( ! setCascade || typeof label !== 'string' || ! label ) {
			return undefined;
		}
		// Parsed back from the signature rather than closing over `cascade`, so
		// this effect depends only on the value identity and not on the array's
		// reference, which is new on every render.
		const parsed = JSON.parse( cascadeSignature );
		if ( ! parsed.length ) {
			unsetCascade( label, token );
			return undefined;
		}
		setCascade( label, token, parsed );
		return () => unsetCascade( label, token );
	}, [ setCascade, unsetCascade, label, token, cascadeSignature ] );
}

/**
 * The cascade behind one control: the value in effect, then each layer it
 * covers, with the origin that set it.
 *
 * @param {Object}   props
 * @param {Object[]} props.cascade Cascade groups from `useControlCascade`.
 *
 * @return {Element} The rows.
 */
function ControlCascade( { cascade } ) {
	// A control writing several paths (Appearance sets both font style and
	// weight) needs the property named per group, or two stacks read as one.
	const showProperty = cascade.length > 1;
	return (
		<div className="block-editor-global-styles-inheritance-menu">
			{ cascade.map( ( group ) => (
				<div key={ group.path }>
					{ showProperty && (
						<div className="block-editor-global-styles-inheritance-menu__property">
							{ group.property }
						</div>
					) }
					{ group.entries.map( ( entry, index ) => (
						<div
							key={ `${ entry.label }-${ index }` }
							className={
								entry.isWinner
									? 'block-editor-global-styles-inheritance-menu__layer is-in-effect'
									: 'block-editor-global-styles-inheritance-menu__layer'
							}
						>
							<span className="block-editor-global-styles-inheritance-menu__origin">
								{ entry.label }
							</span>
							<span className="block-editor-global-styles-inheritance-menu__value">
								{ entry.value }
							</span>
							{ /*
							 * Which layer wins is conveyed visually by the
							 * strikethrough alone. The description is read as
							 * one run of text, so without this a screen reader
							 * hears four values and no way to tell which one
							 * applies.
							 */ }
							<VisuallyHidden>
								{ entry.isWinner
									? /* translators: Follows a style value, marking it as the one currently applied. */
									  __( 'in effect.' )
									: /* translators: Follows a style value, marking it as covered by a higher layer. */
									  __( 'overridden.' ) }
							</VisuallyHidden>
						</div>
					) ) }
				</div>
			) ) }
		</div>
	);
}

/**
 * Reads the collected cascades and hands the panel a per-menu-item renderer.
 *
 * Split from `InheritanceToolsPanel` because the state lives in the provider
 * that component renders, which its own render cannot read.
 *
 * @param {Object} props Props for the underlying `ToolsPanel`.
 *
 * @return {Element} The panel.
 */
function InheritanceToolsPanelInner( props ) {
	const cascades = useContext( InheritanceMenuContext )?.cascades;

	const renderDescription = useCallback(
		( label ) => {
			const cascade = cascades?.[ label ]?.cascade;
			return cascade?.length ? (
				<ControlCascade cascade={ cascade } />
			) : null;
		},
		[ cascades ]
	);

	return (
		<ToolsPanel
			{ ...props }
			__experimentalMenuItemDescription={ renderDescription }
		/>
	);
}

/**
 * Drop-in replacement for `ToolsPanel` in the style panels. With the
 * `gutenberg-global-styles-inheritance-ui` experiment off it is the plain
 * `ToolsPanel`; with it on, each control's menu row gains the cascade behind
 * its value. The panel itself is untouched either way.
 *
 * @param {Object} props Props for the underlying `ToolsPanel`.
 *
 * @return {Element} The panel.
 */
export function InheritanceToolsPanel( props ) {
	if ( ! isGlobalStylesInheritanceEnabled() ) {
		return <ToolsPanel { ...props } />;
	}
	return (
		<InheritanceMenuProvider>
			<InheritanceToolsPanelInner { ...props } />
		</InheritanceMenuProvider>
	);
}
