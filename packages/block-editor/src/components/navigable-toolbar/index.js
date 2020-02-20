/**
 * WordPress dependencies
 */
import { NavigableMenu } from '@wordpress/components';
import { useRef, useEffect, useCallback } from '@wordpress/element';
import { focus } from '@wordpress/dom';
import { useShortcut } from '@wordpress/keyboard-shortcuts';

function NavigableToolbar( { children, focusOnMount, ...props } ) {
	const wrapper = useRef();
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
	}, [] );

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
