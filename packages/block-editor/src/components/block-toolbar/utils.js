/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useRef, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

const { clearTimeout, setTimeout } = window;
const DEBOUNCE_TIMEOUT = 200;
export const highlightBlock = { selectedBlock: 1, parent: 2 };

/**
 * Hook that creates debounced callbacks when the node is hovered or focused.
 *
 * @param {Object}  props                       Component props.
 * @param {Object}  props.ref                   Element reference.
 * @param {boolean} props.isFocused             Whether the component has current focus.
 * @param {number}  props.highlightedBlock      Which block to highlight.
 * @param {number}  [props.debounceTimeout=250] Debounce timeout in milliseconds.
 */
export function useDebouncedShowGestures( {
	ref,
	isFocused,
	highlightedBlock,
	debounceTimeout = DEBOUNCE_TIMEOUT,
} ) {
	const { getSelectedBlockClientId, getBlockRootClientId } =
		useSelect( blockEditorStore );
	const { toggleBlockHighlight } = useDispatch( blockEditorStore );
	const timeoutRef = useRef();
	const isDistractionFree = useSelect(
		( select ) =>
			select( blockEditorStore ).getSettings().isDistractionFree,
		[]
	);
	const handleOnChange = ( nextIsFocused ) => {
		if ( nextIsFocused && isDistractionFree ) {
			return;
		}
		const selectedBlockClientId = getSelectedBlockClientId();
		let clientId;
		if ( highlightedBlock === highlightBlock.selectedBlock ) {
			clientId = selectedBlockClientId;
		}
		if ( highlightedBlock === highlightBlock.parent ) {
			clientId = getBlockRootClientId( selectedBlockClientId );
		}
		toggleBlockHighlight( clientId, nextIsFocused );
	};

	const getIsHovered = () => {
		return ref?.current && ref.current.matches( ':hover' );
	};

	const shouldHideGestures = () => {
		const isHovered = getIsHovered();
		return ! isFocused && ! isHovered;
	};

	const clearTimeoutRef = () => {
		const timeout = timeoutRef.current;

		if ( timeout && clearTimeout ) {
			clearTimeout( timeout );
		}
	};

	const debouncedShowGestures = ( event ) => {
		if ( event ) {
			event.stopPropagation();
		}

		clearTimeoutRef();
		handleOnChange( true );
	};

	const debouncedHideGestures = ( event ) => {
		if ( event ) {
			event.stopPropagation();
		}

		clearTimeoutRef();

		timeoutRef.current = setTimeout( () => {
			if ( shouldHideGestures() ) {
				handleOnChange( false );
			}
		}, debounceTimeout );
	};

	useEffect(
		() => () => {
			/**
			 * We need to call the change handler with `isFocused`
			 * set to false on unmount because we also clear the
			 * timeout that would handle that.
			 */
			handleOnChange( false );
			clearTimeoutRef();
		},
		[]
	);

	return {
		debouncedShowGestures,
		debouncedHideGestures,
	};
}

/**
 * Hook that provides gesture events for DOM elements
 * that interact with the isFocused state.
 *
 * @param {Object} props                       Component props.
 * @param {Object} props.ref                   Element reference.
 * @param {number} props.highlightedBlock      Which block to highlight.
 * @param {number} [props.debounceTimeout=250] Debounce timeout in milliseconds.
 */
export function useShowHoveredOrFocusedGestures( {
	ref,
	highlightedBlock,
	debounceTimeout = DEBOUNCE_TIMEOUT,
} ) {
	const [ isFocused, setIsFocused ] = useState( false );
	const { debouncedShowGestures, debouncedHideGestures } =
		useDebouncedShowGestures( {
			ref,
			debounceTimeout,
			isFocused,
			highlightedBlock,
		} );

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
				debouncedShowGestures();
			}
		};

		const handleOnBlur = () => {
			if ( ! isFocusedWithin() ) {
				setIsFocused( false );
				debouncedHideGestures();
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
		debouncedShowGestures,
		debouncedHideGestures,
	] );

	return {
		onMouseMove: debouncedShowGestures,
		onMouseLeave: debouncedHideGestures,
	};
}
