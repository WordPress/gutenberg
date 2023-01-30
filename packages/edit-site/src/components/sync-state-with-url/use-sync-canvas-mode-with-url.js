/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import { useLocation, useHistory } from '../routes';

export default function useSyncCanvasModeWithURL() {
	const history = useHistory();
	const { params } = useLocation();
	const canvasMode = useSelect(
		( select ) => select( editSiteStore ).__unstableGetCanvasMode(),
		[]
	);
	const { __unstableSetCanvasMode } = useDispatch( editSiteStore );
	const currentCanvasMode = useRef( canvasMode );
	const { canvas: canvasInUrl = 'view' } = params;
	const currentCanvasInUrl = useRef( canvasInUrl );
	useEffect( () => {
		currentCanvasMode.current = canvasMode;
		if ( currentCanvasMode !== currentCanvasInUrl ) {
			history.push( {
				...params,
				canvas: canvasMode,
			} );
		}
	}, [ canvasMode ] );

	useEffect( () => {
		currentCanvasInUrl.current = canvasInUrl;
		if ( canvasInUrl !== currentCanvasMode.current ) {
			__unstableSetCanvasMode( canvasInUrl );
		}
	}, [ canvasInUrl ] );
}
