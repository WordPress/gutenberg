import { useState, useRef } from '@wordpress/element';
import {
	createHigherOrderComponent,
	useRefEffect,
	useMergeRefs,
} from '@wordpress/compose';
import { isKeyboardEvent } from '@wordpress/keycodes';
import type { WPKeycodeModifier } from '@wordpress/keycodes';
import { focus } from '@wordpress/dom';

const defaultShortcuts = {
	previous: [
		{
			modifier: 'ctrlShift',
			character: '`',
		},
		{
			modifier: 'ctrlShift',
			character: '~',
		},
		{
			modifier: 'access',
			character: 'p',
		},
	] as const,
	next: [
		{
			modifier: 'ctrl',
			character: '`',
		},
		{
			modifier: 'access',
			character: 'n',
		},
	] as const,
};

type Shortcuts = {
	previous: readonly { modifier: WPKeycodeModifier; character: string }[];
	next: readonly { modifier: WPKeycodeModifier; character: string }[];
};

export function useNavigateRegions( shortcuts: Shortcuts = defaultShortcuts ) {
	const ref = useRef< HTMLDivElement >( null );
	const [ isFocusingRegions, setIsFocusingRegions ] = useState( false );
	const lastFocusPerRegion = useRef(
		new WeakMap< HTMLElement, HTMLElement >()
	);

	// The active element, descending into same-origin frames: within them,
	// the document only reports the frame element itself as active.
	function getDeepActiveElement() {
		let element = ref.current?.ownerDocument?.activeElement ?? null;
		while ( element?.tagName === 'IFRAME' ) {
			const inner = ( element as HTMLIFrameElement ).contentDocument
				?.activeElement;
			if ( ! inner ) {
				break;
			}
			element = inner;
		}
		// Frame documents are other realms, so no instanceof checks here.
		return ( element as HTMLElement | null ) ?? null;
	}

	// Whether the element sits inside the region, crossing same-origin frame
	// boundaries upwards.
	function isInsideRegion( region: HTMLElement, element: HTMLElement ) {
		let node: Element | null = element;
		while ( node ) {
			if ( region.contains( node ) ) {
				return true;
			}
			node = node.ownerDocument?.defaultView?.frameElement ?? null;
		}
		return false;
	}

	function getWrappingRegion() {
		// Based off the current element, use closest to determine the wrapping region since this operates up the DOM. Also, match tabindex to avoid edge cases with regions we do not want.
		return (
			ref.current?.ownerDocument?.activeElement?.closest< HTMLElement >(
				'[role="region"][tabindex="-1"]'
			) ?? null
		);
	}

	function focusRegion( offset: number ) {
		const found = Array.from(
			ref.current?.querySelectorAll< HTMLElement >(
				'[role="region"][tabindex="-1"]'
			) ?? []
		).filter( ( region ) => {
			// Skip regions the user cannot reach anything in: no visible box
			// and nothing tabbable inside. Regions that only hold controls
			// revealed on focus, like the closed publish panel's toggle, stay
			// in the cycle.
			const { width, height } = region.getBoundingClientRect();
			const hasVisibleBox =
				width > 0 && height > 0 && region.checkVisibility?.() !== false;
			return hasVisibleBox || focus.tabbable.find( region ).length > 0;
		} );

		// A region nested in another, like the block toolbar floating over
		// the content, comes before its container: it also precedes it
		// visually. Document order puts containers first, so each nested
		// region is moved up in a single pass.
		const regions: HTMLElement[] = [];
		for ( const region of found ) {
			const containerIndex = regions.findIndex( ( placed ) =>
				placed.contains( region )
			);
			if ( containerIndex === -1 ) {
				regions.push( region );
			} else {
				regions.splice( containerIndex, 0, region );
			}
		}
		if ( ! regions.length ) {
			return;
		}
		let nextRegion = regions[ 0 ];
		const wrappingRegion = getWrappingRegion();
		const selectedIndex = wrappingRegion
			? regions.indexOf( wrappingRegion )
			: -1;
		if ( selectedIndex !== -1 ) {
			let nextIndex = selectedIndex + offset;
			nextIndex = nextIndex === -1 ? regions.length - 1 : nextIndex;
			nextIndex = nextIndex === regions.length ? 0 : nextIndex;
			nextRegion = regions[ nextIndex ];
		}

		nextRegion.focus();
		setIsFocusingRegions( true );
	}

	const clickRef = useRefEffect(
		( element ) => {
			function onClick() {
				setIsFocusingRegions( false );
			}

			element.addEventListener( 'click', onClick );

			return () => {
				element.removeEventListener( 'click', onClick );
			};
		},
		[ setIsFocusingRegions ]
	);

	return {
		ref: useMergeRefs( [ ref, clickRef ] ),
		className: isFocusingRegions ? 'is-focusing-regions' : '',
		onKeyDown( event: React.KeyboardEvent< HTMLDivElement > ) {
			// A prevented key closed a popover, cancelled an operation, or
			// was otherwise claimed; navigation only gets it after everything
			// else has passed on it.
			if ( event.defaultPrevented ) {
				return;
			}

			const activeElement = ref.current?.ownerDocument?.activeElement;
			const isOnRegion =
				activeElement instanceof HTMLElement &&
				activeElement.matches( '[role="region"][tabindex="-1"]' ) &&
				ref.current?.contains( activeElement );

			if (
				event.key === 'Escape' &&
				! event.ctrlKey &&
				! event.metaKey &&
				! event.altKey &&
				! isOnRegion
			) {
				const wrappingRegion = getWrappingRegion();

				if ( ! wrappingRegion ) {
					return;
				}

				// Listeners delegated at a document level, among them the
				// canvas listener undoing an automatic change, run after this
				// handler for the same press. Waiting a microtask lets every
				// one of them claim the key first: event dispatch is
				// synchronous, so by then the native event carries the final
				// word.
				const { nativeEvent } = event;
				queueMicrotask( () => {
					if ( nativeEvent.defaultPrevented ) {
						return;
					}

					// Remember where focus came from, so Enter can go back.
					const previous = getDeepActiveElement();
					if ( previous ) {
						lastFocusPerRegion.current.set(
							wrappingRegion,
							previous
						);
					}
					wrappingRegion.focus();
					setIsFocusingRegions( true );
				} );
				return;
			}

			if (
				isOnRegion &&
				event.key === 'Tab' &&
				! event.ctrlKey &&
				! event.metaKey &&
				! event.altKey
			) {
				// On a region, the page's focus stops are the regions, so Tab
				// moves between them: forward, or backward with Shift.
				event.preventDefault();
				focusRegion( event.shiftKey ? -1 : 1 );
				return;
			}

			if (
				isOnRegion &&
				event.key === 'Enter' &&
				! event.ctrlKey &&
				! event.metaKey &&
				! event.altKey &&
				! event.shiftKey
			) {
				event.preventDefault();

				// Enter goes back to where focus was when Escape stepped out
				// of this region, when that place still exists.
				const remembered =
					lastFocusPerRegion.current.get( activeElement );
				if (
					remembered?.isConnected &&
					isInsideRegion( activeElement, remembered )
				) {
					remembered.focus();
					return;
				}

				// Otherwise onto the region's first tabbable, descending into
				// a same-origin frame.
				let target: HTMLElement | undefined = focus.tabbable.find(
					activeElement
				)[ 0 ] as HTMLElement | undefined;
				while ( target?.tagName === 'IFRAME' ) {
					const frameDocument = ( target as HTMLIFrameElement )
						.contentDocument;
					if ( ! frameDocument?.body ) {
						break;
					}
					const inner = focus.tabbable.find(
						frameDocument.body
					)[ 0 ] as HTMLElement | undefined;
					if ( ! inner ) {
						break;
					}
					target = inner;
				}
				target?.focus();
				return;
			}

			if (
				shortcuts.previous.some( ( { modifier, character } ) => {
					return isKeyboardEvent[ modifier ]( event, character );
				} )
			) {
				focusRegion( -1 );
			} else if (
				shortcuts.next.some( ( { modifier, character } ) => {
					return isKeyboardEvent[ modifier ]( event, character );
				} )
			) {
				focusRegion( 1 );
			}
		},
	};
}

/**
 * `navigateRegions` is a React [higher-order component](https://facebook.github.io/react/docs/higher-order-components.html)
 * adding keyboard navigation to switch between the different DOM elements marked as "regions" (role="region").
 * These regions should be focusable (By adding a tabIndex attribute for example). For better accessibility,
 * these elements must be properly labelled to briefly describe the purpose of the content in the region.
 * For more details, see "Landmark Roles" in the [WAI-ARIA specification](https://www.w3.org/TR/wai-aria/)
 * and "Landmark Regions" in the [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/).
 *
 * ```jsx
 * import { navigateRegions } from '@wordpress/components';
 *
 * const MyComponentWithNavigateRegions = navigateRegions( () => (
 * 	<div>
 * 		<div role="region" tabIndex="-1" aria-label="Header">
 * 			Header
 * 		</div>
 * 		<div role="region" tabIndex="-1" aria-label="Content">
 * 			Content
 * 		</div>
 * 		<div role="region" tabIndex="-1" aria-label="Sidebar">
 * 			Sidebar
 * 		</div>
 * 	</div>
 * ) );
 * ```
 */
export default createHigherOrderComponent(
	( Component ) =>
		function NavigateRegions( { shortcuts, ...props } ) {
			return (
				<div { ...useNavigateRegions( shortcuts ) }>
					<Component { ...props } />
				</div>
			);
		},
	'navigateRegions'
);
