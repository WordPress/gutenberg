/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState, useRef, useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

const { clearTimeout, setTimeout } = window;

const DEBOUNCE_TIMEOUT = 200;

/**
 * Hook that creates a showMover state, as well as debounced show/hide callbacks.
 *
 * @param {Object}   props                       Component props.
 * @param {Object}   props.ref                   Element reference.
 * @param {boolean}  props.isFocused             Whether the component has current focus.
 * @param {number}   [props.debounceTimeout=250] Debounce timeout in milliseconds.
 * @param {Function} [props.onChange=noop]       Callback function.
 */
export function useDebouncedShowMovers( {
	ref,
	isFocused,
	debounceTimeout = DEBOUNCE_TIMEOUT,
	onChange = noop,
} ) {
	const [ showMovers, setShowMovers ] = useState( false );
	const timeoutRef = useRef();

	const handleOnChange = ( nextIsFocused ) => {
		if ( ref?.current ) {
			setShowMovers( nextIsFocused );
		}

		onChange( nextIsFocused );
	};

	const getIsHovered = () => {
		return ref?.current && ref.current.matches( ':hover' );
	};

	const shouldHideMovers = () => {
		const isHovered = getIsHovered();

		return ! isFocused && ! isHovered;
	};

	const clearTimeoutRef = () => {
		const timeout = timeoutRef.current;

		if ( timeout && clearTimeout ) {
			clearTimeout( timeout );
		}
	};

	const debouncedShowMovers = ( event ) => {
		if ( event ) {
			event.stopPropagation();
		}

		clearTimeoutRef();

		if ( ! showMovers ) {
			handleOnChange( true );
		}
	};

	const debouncedHideMovers = ( event ) => {
		if ( event ) {
			event.stopPropagation();
		}

		clearTimeoutRef();

		timeoutRef.current = setTimeout( () => {
			if ( shouldHideMovers() ) {
				handleOnChange( false );
			}
		}, debounceTimeout );
	};

	useEffect( () => () => clearTimeoutRef(), [] );

	return {
		showMovers,
		debouncedShowMovers,
		debouncedHideMovers,
	};
}

/**
 * Hook that provides a showMovers state and gesture events for DOM elements
 * that interact with the showMovers state.
 *
 * @param {Object}   props                       Component props.
 * @param {Object}   props.ref                   Element reference.
 * @param {number}   [props.debounceTimeout=250] Debounce timeout in milliseconds.
 * @param {Function} [props.onChange=noop]       Callback function.
 * @param {string}   props.clientId              Block Client Id
 */
export function useShowMoversGestures( {
	clientId,
	ref,
	debounceTimeout = DEBOUNCE_TIMEOUT,
	onChange = noop,
} ) {
	const { toggleBlockHighlight } = useDispatch( blockEditorStore );
	const [ isFocused, setIsFocused ] = useState( false );
	const {
		showMovers,
		debouncedShowMovers,
		debouncedHideMovers,
	} = useDebouncedShowMovers( { ref, debounceTimeout, isFocused, onChange } );

	const registerRef = useRef( false );

	const isFocusedWithin = () => {
		return (
			ref?.current &&
			ref.current.contains( ref.current.ownerDocument.activeElement )
		);
	};

	useEffect( () => {
		const node = ref.current;

		const handleOnFocus = () => {
			if ( isFocusedWithin() ) {
				setIsFocused( true );
				toggleBlockHighlight( clientId, true );
				debouncedShowMovers();
			}
		};

		const handleOnBlur = () => {
			if ( ! isFocusedWithin() ) {
				setIsFocused( false );
				toggleBlockHighlight( clientId, false );
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
