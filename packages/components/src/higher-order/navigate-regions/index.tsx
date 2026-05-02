/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import {
	createHigherOrderComponent,
	useRefEffect,
	useEvent,
} from '@wordpress/compose';
import { isKeyboardEvent } from '@wordpress/keycodes';
import type { WPKeycodeModifier } from '@wordpress/keycodes';

type Shortcut = { modifier: WPKeycodeModifier; character: string };
type Shortcuts = { previous: readonly Shortcut[]; next: readonly Shortcut[] };

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

const getShortcutSign = (
	event: React.KeyboardEvent< HTMLElement > | KeyboardEvent,
	shortcuts: Shortcuts
) => {
	const isMatch = ( { modifier, character }: Shortcut ) =>
		isKeyboardEvent[ modifier ]( event, character );
	if ( shortcuts.previous.some( isMatch ) ) {
		return -1;
	} else if ( shortcuts.next.some( isMatch ) ) {
		return 1;
	}
	return 0;
};

const regionsSelector = '[role="region"][tabindex="-1"]';

const focusRegion = ( root: HTMLElement, offset: number ) => {
	const regions = root.querySelectorAll< HTMLElement >( regionsSelector );
	if ( ! regions.length ) {
		return;
	}
	let nextRegion = regions[ 0 ];
	const { activeElement } = root.ownerDocument;
	// Based off the current element, use closest to determine the wrapping region since this operates up the DOM. Also, match tabindex to avoid edge cases with regions we do not want.
	const wrappingRegion =
		activeElement?.closest< HTMLElement >( regionsSelector );
	const selectedIndex = wrappingRegion
		? [ ...regions ].indexOf( wrappingRegion )
		: -1;
	if ( selectedIndex !== -1 ) {
		let nextIndex = selectedIndex + offset;
		nextIndex = nextIndex === -1 ? regions.length - 1 : nextIndex;
		nextIndex = nextIndex === regions.length ? 0 : nextIndex;
		nextRegion = regions[ nextIndex ];
	}

	nextRegion.focus();
};

export function useNavigateRegions(
	options: Shortcuts | { shortcuts: Shortcuts; isGlobal: boolean }
) {
	let shortcuts: Shortcuts = defaultShortcuts;
	let isGlobal = false;
	if ( options ) {
		if ( 'previous' in options && 'next' in options ) {
			shortcuts = options;
		} else {
			if ( 'shortcuts' in options ) {
				( { shortcuts } = options );
			}
			if ( 'isGlobal' in options ) {
				( { isGlobal } = options );
			}
		}
	}
	const [ isFocusingRegions, setIsFocusingRegions ] = useState( false );

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

	const navigate = useEvent(
		(
			event: KeyboardEvent | React.KeyboardEvent< HTMLElement >,
			root: HTMLElement
		) => {
			const sign = getShortcutSign( event, shortcuts );
			if ( sign ) {
				focusRegion( root, sign );
				if ( isGlobal ) {
					root.classList.add( 'is-focusing-regions' );
				} else {
					setIsFocusingRegions( true );
				}
			}
		}
	);

	const globalEffect = useRefEffect< HTMLElement >(
		( node ) => {
			const { ownerDocument } = node;
			if ( ! ownerDocument ) {
				return;
			}
			const onKeyDown = ( event: KeyboardEvent ) =>
				navigate( event, node );
			const onPointerDown = () => {
				node.classList.remove( 'is-focusing-regions' );
			};
			ownerDocument.addEventListener( 'keydown', onKeyDown );
			ownerDocument.addEventListener( 'pointerdown', onPointerDown );
			return () => {
				ownerDocument.removeEventListener( 'keydown', onKeyDown );
				ownerDocument.removeEventListener(
					'pointerdown',
					onPointerDown
				);
			};
		},
		[ navigate ]
	);

	return isGlobal
		? globalEffect
		: {
				ref: clickRef,
				className: isFocusingRegions ? 'is-focusing-regions' : '',
				onKeyDown: ( event: React.KeyboardEvent< HTMLElement > ) =>
					navigate( event, event.currentTarget ),
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
