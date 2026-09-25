import clsx from 'clsx';
import { __experimentalToolsPanelItem as ToolsPanelItem } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { useContext, useEffect, useRef, useState } from '@wordpress/element';
import { useBlockEditContext } from '../../block-edit/context';
import { InheritanceSourceContext, InheritanceSourceHelp } from './source';

export {
	InheritanceSourceContext,
	InheritanceSourceHelp,
	InheritedCustomCSSHelp,
} from './source';

/**
 * Whether the inspector marks up which controls are showing an inherited
 * Global Styles value.
 *
 * This gates the indicators only: the dotted underline on an inherited label
 * and the blue dot that resets a local override. The inherited values
 * themselves reach the controls either way. Behind the
 * `gutenberg-global-styles-inheritance-ui` Gutenberg experiment, so the
 * indicators are off unless someone opts in on the Experiments screen.
 *
 * Evaluated per call rather than once at module scope, so tests can toggle
 * the experiment and so a later move to a store-backed setting only has to
 * change this one place. Always returns a boolean: callers pass the result
 * down as a prop, and `undefined` would trigger a receiving component's own
 * default parameter.
 *
 * @return {boolean} Whether the indicator treatment is enabled.
 */
export const isGlobalStylesInheritanceIndicatorUIEnabled = () =>
	!! window.__experimentalGlobalStylesInheritanceUI;

/**
 * Returns props to spread onto a wrapping `<InheritanceToolsPanelItem>`
 * so its descendant label picks up the inherited-from-Global-Styles
 * visual treatment.
 *
 * When `isInherited` is true without a local override, the descendant
 * label text receives the inherited-from-Global-Styles treatment
 * (dotted underline). No dot is shown.
 *
 * When `hasLocalOverride` is true, the item gets the local-override class and
 * no inherited treatment.
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
 * - Local override: the label keeps its plain treatment. A value set on the
 *   block is reset from the `ToolsPanel` options menu, or the control's own
 *   Reset, as without the experiment.
 *
 * @param {Object}                    props
 * @param {?string}                   props.className                  Item className.
 * @param {boolean}                   props.isInherited                Value is inherited at rest. Accepted so the `getInheritanceProps` spread does not leak onto the underlying `ToolsPanelItem`; the inherited treatment is applied via `className`.
 * @param {boolean}                   props.hasLocalOverride           Local override is set.
 * @param {import('react').ReactNode} props.label                      Control label.
 * @param {?Function}                 props.onDeselect                 Reset handler.
 * @param {string|string[]}           [props.inheritancePath]          Global Styles path(s) the control edits. When set, a line under the control names where its value comes from.
 * @param {boolean}                   [props.inheritanceHelpInPopover] The control shows the line in its picker popover; the item keeps it only as the control's description, and after a reset.
 * @param {import('react').ReactNode} props.children                   The control.
 *
 * @return {Element} The panel item.
 */
/**
 * Tracks whether a control's value was just reset to the inherited one: it
 * held a local value, and now shows an inherited value, on the same block.
 * Covers every way back (the panel's options menu, a control's own Reset,
 * Reset all, undo). Cleared by a click outside the item or by focus moving
 * into another panel item.
 *
 * @param {Object}   ref         Ref to the item element.
 * @param {boolean}  isInherited Control shows an inherited value.
 * @param {Function} hasValue    Whether the control holds a local value.
 * @return {boolean} Whether to show the line as just reset.
 */
function useJustReset( ref, isInherited, hasValue ) {
	const { clientId } = useBlockEditContext();
	const hasLocalValue = !! hasValue?.();
	const previousRef = useRef( { clientId, hasLocalValue } );
	const [ isJustReset, setIsJustReset ] = useState( false );

	useEffect( () => {
		const { clientId: previousClientId, hasLocalValue: hadLocalValue } =
			previousRef.current;
		previousRef.current = { clientId, hasLocalValue };
		if ( previousClientId !== clientId ) {
			setIsJustReset( false );
		} else if ( hadLocalValue && ! hasLocalValue && isInherited ) {
			setIsJustReset( true );
		}
	}, [ clientId, hasLocalValue, isInherited ] );

	useEffect( () => {
		const element = ref.current;
		if ( ! isJustReset || ! element ) {
			return;
		}
		const { ownerDocument } = element;
		const clear = ( event ) => {
			const target = event.target;
			if ( element.contains( target ) ) {
				return;
			}
			// Focus returning to the panel's options menu after a reset from
			// it keeps the line; focus moving to another control clears it.
			if (
				event.type === 'focusin' &&
				! target.closest?.( '.components-tools-panel-item' )
			) {
				return;
			}
			setIsJustReset( false );
		};
		ownerDocument.addEventListener( 'pointerdown', clear, true );
		ownerDocument.addEventListener( 'focusin', clear, true );
		return () => {
			ownerDocument.removeEventListener( 'pointerdown', clear, true );
			ownerDocument.removeEventListener( 'focusin', clear, true );
		};
	}, [ isJustReset, ref ] );

	return isJustReset;
}

// Focusable parts of a control that should carry its description.
const DESCRIBED_CONTROLS =
	'input, select, textarea, button:not([aria-hidden="true"]), [role="radio"], [role="slider"]';

/**
 * Points the item's focusable controls at the origin line with
 * `aria-describedby`, so screen readers read where the value comes from when
 * focus enters the control, even while the line is collapsed or hidden. The
 * controls are rendered by many components, so the attribute is added to the
 * DOM rather than threaded through each one; ids a control sets itself are
 * kept.
 *
 * @param {Object}  ref     Ref to the item element.
 * @param {boolean} enabled Whether the control has an origin line.
 * @param {string}  helpId  Id of the origin line.
 */
function useDescribedControls( ref, enabled, helpId ) {
	useEffect( () => {
		const element = ref.current;
		if ( ! enabled || ! element ) {
			return;
		}
		const update = () => {
			element
				.querySelectorAll( DESCRIBED_CONTROLS )
				.forEach( ( control ) => {
					const ids = (
						control.getAttribute( 'aria-describedby' ) ?? ''
					)
						.split( ' ' )
						.filter( Boolean );
					if ( ! ids.includes( helpId ) ) {
						control.setAttribute(
							'aria-describedby',
							[ ...ids, helpId ].join( ' ' )
						);
					}
				} );
		};
		update();
		// Controls mount and remount inside the item (e.g. a custom size
		// input replacing the size buttons), so keep new ones described.
		const observer = new element.ownerDocument.defaultView.MutationObserver(
			update
		);
		observer.observe( element, { childList: true, subtree: true } );
		return () => {
			observer.disconnect();
			element
				.querySelectorAll( '[aria-describedby]' )
				.forEach( ( control ) => {
					const ids = control
						.getAttribute( 'aria-describedby' )
						.split( ' ' )
						.filter( ( id ) => id && id !== helpId );
					if ( ids.length ) {
						control.setAttribute(
							'aria-describedby',
							ids.join( ' ' )
						);
					} else {
						control.removeAttribute( 'aria-describedby' );
					}
				} );
		};
	}, [ ref, enabled, helpId ] );
}

export function InheritanceToolsPanelItem( {
	className,
	// Destructured so the `getInheritanceProps` spread does not leak
	// `isInherited` onto the underlying `ToolsPanelItem`. The label treatment
	// is applied via `className` (`is-inherited-from-global-styles`).
	isInherited,
	// Also destructured so it does not leak onto `ToolsPanelItem`; the local
	// override treatment is applied via `className`.
	hasLocalOverride,
	label,
	onDeselect,
	inheritancePath,
	inheritanceHelpInPopover = false,
	children,
	...rest
} ) {
	const ref = useRef();
	const helpId = useInstanceId(
		InheritanceToolsPanelItem,
		'global-styles-inheritance-help'
	);
	const isJustReset = useJustReset( ref, isInherited, rest.hasValue );
	const resolved = useContext( InheritanceSourceContext );
	// Every control with a path gets a line in the block inspector: where an
	// inherited value comes from, or that the value is set on the block.
	const hasHelp = !! inheritancePath && !! resolved;
	useDescribedControls( ref, hasHelp, helpId );

	return (
		<ToolsPanelItem
			ref={ ref }
			className={ className }
			label={ label }
			onDeselect={ onDeselect }
			{ ...rest }
		>
			{ children }
			{ inheritancePath && (
				<InheritanceSourceHelp
					id={ helpId }
					path={ inheritancePath }
					isInherited={ isInherited }
					hasLocalValue={ !! rest.hasValue?.() }
					isJustReset={ isJustReset }
					// Controls with a picker show the line in the picker; here
					// it describes the control, and shows after a reset or
					// with the panel's style origins toggle.
					isDescriptionOnly={ inheritanceHelpInPopover }
				/>
			) }
		</ToolsPanelItem>
	);
}
