/**
 * WordPress dependencies
 */
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from '@wordpress/element';

const useIsomorphicLayoutEffect =
	typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * @template {Array<any>} T
 * @typedef {(...args: T) => void} OnDragStart
 */
/** @typedef {(e: MouseEvent) => void} OnDragMove */
/**
 * @template {Array<any>} T
 * @typedef {} OnDragEnd
 */

/**
 * @template {Array<any>} StartArgs
 * @template {Array<any>} EndArgs
 * @param {{onDragStart: OnDragStart<StartArgs>, onDragMove: OnDragMove,  onDragEnd: OnDragEnd<EndArgs>}} _
 */
export default function useDragging( { onDragStart, onDragMove, onDragEnd } ) {
	const [ isDragging, setIsDragging ] = useState( false );

	const eventsRef = useRef( {
		onDragStart,
		onDragMove,
		onDragEnd,
	} );
	useIsomorphicLayoutEffect( () => {
		eventsRef.current.onDragStart = onDragStart;
		eventsRef.current.onDragMove = onDragMove;
		eventsRef.current.onDragEnd = onDragEnd;
	}, [ onDragStart, onDragMove, onDragEnd ] );

	const onMouseMove = useCallback(
		( ...args ) =>
			eventsRef.current.onDragMove &&
			eventsRef.current.onDragMove( ...args ),
		[]
	);
	const endDrag = useCallback( ( ...args ) => {
		if ( eventsRef.current.onDragEnd ) {
			eventsRef.current.onDragEnd( ...args );
		}
		document.removeEventListener( 'mousemove', onMouseMove );
		document.removeEventListener( 'mouseup', endDrag );
		setIsDragging( false );
	}, [] );
	/** @type {(...args: StartArgs) => void}  */
	const startDrag = useCallback( ( ...args ) => {
		if ( eventsRef.current.onDragStart ) {
			eventsRef.current.onDragStart( ...args );
		}
		document.addEventListener( 'mousemove', onMouseMove );
		document.addEventListener( 'mouseup', endDrag );
		setIsDragging( true );
	}, [] );

	// Remove the global events when unmounting if needed.
	useEffect( () => {
		return () => {
			if ( isDragging ) {
				document.removeEventListener( 'mousemove', onMouseMove );
				document.removeEventListener( 'mouseup', endDrag );
			}
		};
	}, [ isDragging ] );

	return {
		startDrag,
		endDrag,
		isDragging,
	};
}
