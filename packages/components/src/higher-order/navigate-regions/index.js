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
import { focus } from '@wordpress/dom';

const defaultShortcuts = {
	previous: [
		{
			modifier: 'ctrlShift',
			character: '`',
		},
		{
			modifier: 'access',
			character: 'p',
		},
	],
	next: [
		{
			modifier: 'ctrl',
			character: '`',
		},
		{
			modifier: 'access',
			character: 'n',
		},
	],
};

export function useNavigateRegions( shortcuts = defaultShortcuts ) {
	const ref = useRef();
	const [ isFocusingRegions, setIsFocusingRegions ] = useState( false );

	function focusRegion( offset ) {
		const regions = Array.from(
			ref.current.querySelectorAll( '[role="region"]' )
		);
		if ( ! regions.length ) {
			return;
		}
		let nextRegion = regions[ 0 ];
		// Based off the current element, find the next region.
		const selectedIndex = regions.indexOf(
			ref.current.ownerDocument.activeElement.closest( '[role="region"]' )
		);
		if ( selectedIndex !== -1 ) {
			let nextIndex = selectedIndex + offset;
			nextIndex = nextIndex === -1 ? regions.length - 1 : nextIndex;
			nextIndex = nextIndex === regions.length ? 0 : nextIndex;
			nextRegion = regions[ nextIndex ];
		}

		// Add the tabindex of -1 so tabbable elements can be located.
		nextRegion.setAttribute( 'tabindex', '-1' );
		// Find the next tabbable within the region.
		const nextTabbable = focus.tabbable.findNext( nextRegion );
		// Is there a next tabbable available? If not, focus the region instead.
		const nextFocus = nextTabbable ? nextTabbable : nextRegion;
		// Focus our chosen area, either the first tabbable within the region or the region itself.
		nextFocus.focus();
		// Remove the tabindex, no longer needed after focus.
		nextRegion.removeAttribute( 'tabindex' );

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
		onKeyDown( event ) {
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

export default createHigherOrderComponent(
	( Component ) =>
		( { shortcuts, ...props } ) =>
			(
				<div { ...useNavigateRegions( shortcuts ) }>
					<Component { ...props } />
				</div>
			),
	'navigateRegions'
);
