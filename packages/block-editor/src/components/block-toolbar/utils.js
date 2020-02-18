/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';
import { useState, useRef, useEffect, useCallback } from '@wordpress/element';

const {
	cancelAnimationFrame,
	clearTimeout,
	setTimeout,
	requestAnimationFrame,
} = window;

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
		return ref && ref.current.matches( ':hover' );
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
		return ref && ref.current.contains( document.activeElement );
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

const EDITOR_SELECTOR = '.editor-styles-wrapper';

/**
 * This is experimental.
 */
export function useExperimentalToolbarPositioning( { ref } ) {
	const containerNode = document.querySelector( EDITOR_SELECTOR );
	const translateXRef = useRef( 0 );
	const isViewportSmall = useViewportMatch( 'medium', '<' );

	// MATH values
	const moverWidth = 48;
	const buffer = 8;
	const offsetLeft = moverWidth + buffer;

	const updatePosition = useCallback( () => {
		const node = ref.current;
		if ( ! node ) return;

		const targetNode = node.parentElement;
		if ( ! targetNode ) return;

		const { x: containerX, right: containerRight } = getCoords(
			containerNode
		);
		const { x: nodeX, left: nodeLeft, right: nodeRight } = getCoords(
			targetNode
		);

		if ( nodeLeft < 0 ) return;

		const currentTranslateX = translateXRef.current;
		let nextTranslateX;

		// Computed values
		const totalOffsetLeft = nodeX - offsetLeft;
		const totalOffsetRight = nodeRight + buffer;

		const isOverflowLeft = totalOffsetLeft < containerX;
		const isOverflowRight = totalOffsetRight > containerRight;

		if ( isOverflowLeft ) {
			nextTranslateX = containerX - totalOffsetLeft + currentTranslateX;
			translateXRef.current = nextTranslateX;
		} else if ( isOverflowRight ) {
			nextTranslateX =
				containerRight - totalOffsetRight + currentTranslateX;
			translateXRef.current = nextTranslateX;
		} else {
			// TODO: Improve reset rendering
			translateXRef.current = 0;
		}

		if ( isViewportSmall ) {
			nextTranslateX = 0;
		}

		if ( nextTranslateX ) {
			const translateX = Math.round( nextTranslateX );
			targetNode.style.transform = `translateX(${ translateX }px)`;
		}

		targetNode.style.opacity = 1;
	}, [] );

	useHideOnInitialRender( { ref } );
	useRequestAnimationFrameLoop( updatePosition );
}

function useHideOnInitialRender( { ref } ) {
	useEffect( () => {
		const node = ref.current;
		if ( ! node ) return;

		const targetNode = node.parentElement;
		targetNode.style.opacity = 0;
	}, [ ref ] );
}

function useRequestAnimationFrameLoop( callback ) {
	const rafLoopRef = useRef();

	const rafCallback = ( ...args ) => {
		if ( callback ) {
			callback( ...args );
		}
		rafLoopRef.current = requestAnimationFrame( rafCallback );
	};

	useEffect( () => {
		const cancelAnimationLoop = () => {
			if ( rafLoopRef.current ) {
				cancelAnimationFrame( rafLoopRef.current );
			}
		};

		rafLoopRef.current = requestAnimationFrame( rafCallback );

		return () => {
			cancelAnimationLoop();
		};
	}, [ rafLoopRef ] );
}

function getCoords( node ) {
	if ( ! node ) {
		return new window.DOMRect( 0, 0, 0, 0 );
	}

	const { x, left, width } = node.getBoundingClientRect();

	return {
		x,
		left,
		width,
		right: x + width,
	};
}
