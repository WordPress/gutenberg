/**
 * External dependencies
 */
import { useToolbarState, Toolbar } from 'reakit/Toolbar';

/**
 * WordPress dependencies
 */
import {
	forwardRef,
	useState,
	useRef,
	useEffect,
	useCallback,
	useLayoutEffect,
	useMemo,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import ToolbarContext from '../toolbar-context';
import { getRTL } from '../utils/rtl';

function ToolbarContainer( { label, ...props }, ref ) {
	// https://reakit.io/docs/basic-concepts/#state-hooks
	// Passing baseId for server side rendering (which includes snapshots)
	// If an id prop is passed to Toolbar, toolbar items will use it as a base for their ids
	const state = useToolbarState( {
		loop: true,
		baseId: props.id,
		rtl: getRTL(),
	} );
	const [ initialToolbarState ] = useState( state );
	const toolbarStateRef = useRef( state );
	const listenersRef = useRef( new Set() );
	const toolbarState = useMemo( () => state, Object.values( state ) );

	useLayoutEffect( () => {
		toolbarStateRef.current = toolbarState;
	} );

	const subscribe = useCallback( ( listener ) => {
		listener( toolbarStateRef.current );
		listenersRef.current.add( listener );
		return () => listenersRef.current.delete( listener );
	}, [] );

	useEffect( () => {
		for ( const listener of listenersRef.current ) {
			listener( toolbarState );
		}
	}, [ toolbarState ] );

	const value = useMemo( () => ( { ...initialToolbarState, subscribe } ), [
		initialToolbarState,
		subscribe,
	] );

	return (
		// This will provide state for `ToolbarButton`'s
		<ToolbarContext.Provider value={ value }>
			<Toolbar
				ref={ ref }
				aria-label={ label }
				{ ...toolbarState }
				{ ...props }
			/>
		</ToolbarContext.Provider>
	);
}

export default forwardRef( ToolbarContainer );
