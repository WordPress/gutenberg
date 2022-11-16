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
		const selectedIndex = regions.indexOf(
			ref.current.ownerDocument.activeElement
		);
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
