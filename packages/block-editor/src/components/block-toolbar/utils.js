/**
 * WordPress dependencies
 */
import { useState, useRef, useEffect, useCallback } from '@wordpress/element';

const { clearTimeout, setTimeout } = window;

/**
 * Hook that creates a showMover state, as well as debounced show/hide callbacks
 */
export function useDebouncedShowMovers( {
	ref,
	isFocused,
	debounceTimeout = 500,
} ) {
	const [ showMovers, setShowMovers ] = useState( false );
	const timeoutRef = useRef();

	const getIsHovered = () => {
		return ref?.current && ref.current.matches( ':hover' );
	};

	const shouldHideMovers = () => {
		const isHovered = getIsHovered();

		return ! isFocused && ! isHovered;
	};

	const debouncedShowMovers = useCallback(
		( event ) => {
			if ( event ) {
				event.stopPropagation();
			}

			const timeout = timeoutRef.current;

			if ( timeout && clearTimeout ) {
				clearTimeout( timeout );
			}
			if ( ! showMovers ) {
				setShowMovers( true );
			}
		},
		[ showMovers ]
	);

	const debouncedHideMovers = useCallback(
		( event ) => {
			if ( event ) {
				event.stopPropagation();
			}

			timeoutRef.current = setTimeout( () => {
				if ( shouldHideMovers() ) {
					setShowMovers( false );
				}
			}, debounceTimeout );
		},
		[ isFocused ]
	);

	useEffect( () => () => clearTimeout( timeoutRef.current ), [] );

	return {
		showMovers,
		debouncedShowMovers,
		debouncedHideMovers,
	};
}

/**
 * Hook that provides a showMovers state and gesture events for DOM elements
 * that interact with the showMovers state.
 */
export function useShowMoversGestures( { ref, debounceTimeout = 500 } ) {
	const [ isFocused, setIsFocused ] = useState( false );
	const {
		showMovers,
		debouncedShowMovers,
		debouncedHideMovers,
	} = useDebouncedShowMovers( { ref, debounceTimeout, isFocused } );

	const registerRef = useRef( false );

	const isFocusedWithin = () => {
		return ref?.current && ref.current.contains( document.activeElement );
	};

	useEffect( () => {
		const node = ref.current;

		const handleOnFocus = () => {
			if ( isFocusedWithin() ) {
				setIsFocused( true );
				debouncedShowMovers();
			}
		};

		const handleOnBlur = () => {
			if ( ! isFocusedWithin() ) {
				setIsFocused( false );
				debouncedHideMovers();
			}
		};

		/**
		 * Events are added via DOM events (vs. React synthetic events),
		 * as the child React components swallow mouse events.
		 */
		if ( node && ! registerRef.current ) {
			node.addEventListener( 'focus', handleOnFocus, true );
			node.addEventListener( 'blur', handleOnBlur, true );
			registerRef.current = true;
		}

		return () => {
			if ( node ) {
				node.removeEventListener( 'focus', handleOnFocus );
				node.removeEventListener( 'blur', handleOnBlur );
			}
		};
	}, [
		ref,
		registerRef,
		setIsFocused,
		debouncedShowMovers,
		debouncedHideMovers,
	] );

	return {
		showMovers,
		gestures: {
			onMouseMove: debouncedShowMovers,
			onMouseLeave: debouncedHideMovers,
		},
	};
}
