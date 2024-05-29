/**
 * WordPress dependencies
 */
import { useState, useRef } from '@wordpress/element';
import {
	createHigherOrderComponent,
	useRefEffect,
	useMergeRefs,
} from '@wordpress/compose';
import { isKeyboardEvent } from '@wordpress/keycodes';
import type { WPKeycodeModifier } from '@wordpress/keycodes';

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

	function focusRegion( offset: number ) {
		const regions = Array.from(
			ref.current?.querySelectorAll< HTMLElement >(
				'[role="region"][tabindex="-1"]'
			) ?? []
		);
		if ( ! regions.length ) {
			return;
		}
		let nextRegion = regions[ 0 ];
		// Based off the current element, use closest to determine the wrapping region since this operates up the DOM. Also, match tabindex to avoid edge cases with regions we do not want.
		const wrappingRegion =
			ref.current?.ownerDocument?.activeElement?.closest< HTMLElement >(
				'[role="region"][tabindex="-1"]'
			);
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
		( { shortcuts, ...props } ) => (
			<div { ...useNavigateRegions( shortcuts ) }>
				<Component { ...props } />
			</div>
		),
	'navigateRegions'
);
