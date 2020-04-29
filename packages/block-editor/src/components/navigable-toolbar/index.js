/**
 * WordPress dependencies
 */
import { NavigableMenu, Toolbar } from '@wordpress/components';
import {
	useState,
	useRef,
	useLayoutEffect,
	useEffect,
	useCallback,
} from '@wordpress/element';
import { focus } from '@wordpress/dom';
import { useShortcut } from '@wordpress/keyboard-shortcuts';

function useShouldDisplayAccessibleToolbar( ref ) {
	const [
		shouldDisplayAccessibleToolbar,
		setShouldDisplayAccessibleToolbar,
	] = useState( false );
	useLayoutEffect( () => {
		const wrapper = ref.current;
		const tabbables = focus.tabbable.find( wrapper );
		const notToolbarItem = tabbables.some(
			( tabbable ) => ! ( 'experimentalToolbarItem' in tabbable.dataset )
		);
		if ( ! notToolbarItem ) {
			setShouldDisplayAccessibleToolbar( true );
		}
	} );
	return shouldDisplayAccessibleToolbar;
}

// TODO: Opening Change Alignment Text makes it not be the last child
function NavigableToolbar( { children, focusOnMount, ...props } ) {
	const wrapper = useRef();
	const shouldDisplayAccessibleToolbar = useShouldDisplayAccessibleToolbar(
		wrapper
	);

	const focusToolbar = useCallback( () => {
		const tabbables = focus.tabbable.find( wrapper.current );
		if ( tabbables.length ) {
			tabbables[ 0 ].focus();
		}
	}, [] );

	useShortcut( 'core/block-editor/focus-toolbar', focusToolbar, {
		bindGlobal: true,
		eventName: 'keydown',
	} );

	useEffect( () => {
		if ( focusOnMount ) {
			focusToolbar();
		}
	}, [ shouldDisplayAccessibleToolbar ] );

	if ( shouldDisplayAccessibleToolbar ) {
		return (
			<Toolbar
				__experimentalAccessibilityLabel={ props[ 'aria-label' ] }
				ref={ wrapper }
				{ ...props }
			>
				{ children }
			</Toolbar>
		);
	}

	return (
		<NavigableMenu
			orientation="horizontal"
			role="toolbar"
			ref={ wrapper }
			{ ...props }
		>
			{ children }
		</NavigableMenu>
	);
}

export default NavigableToolbar;
