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
import { unlock } from '../../experiments';

export default function useSyncCanvasModeWithURL() {
	const history = useHistory();
	const { params } = useLocation();
	const canvasMode = useSelect(
		( select ) => unlock( select( editSiteStore ) ).getCanvasMode(),
		[]
	);
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );
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
			setCanvasMode( canvasInUrl );
		}
	}, [ canvasInUrl ] );
}
