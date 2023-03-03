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
import { unlock } from '../../private-apis';

export default function useSyncCanvasModeWithURL() {
	const history = useHistory();
	const { params } = useLocation();
	const canvasMode = useSelect(
		( select ) => unlock( select( editSiteStore ) ).getCanvasMode(),
		[]
	);
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );
	const currentCanvasMode = useRef( canvasMode );
	const { canvas: canvasInUrl } = params;
	const currentCanvasInUrl = useRef( canvasInUrl );
	useEffect( () => {
		currentCanvasMode.current = canvasMode;
		if ( canvasMode === 'init' ) {
			return;
		}

		if (
			canvasMode === 'edit' &&
			currentCanvasInUrl.current !== canvasMode
		) {
			history.push( {
				...params,
				canvas: 'edit',
			} );
		}

		if (
			canvasMode === 'view' &&
			currentCanvasInUrl.current !== undefined
		) {
			history.push( {
				...params,
				canvas: undefined,
			} );
		}
	}, [ canvasMode ] );

	useEffect( () => {
		currentCanvasInUrl.current = canvasInUrl;
		if (
			canvasInUrl === undefined &&
			currentCanvasMode.current !== 'view'
		) {
			setCanvasMode( 'view' );
		} else if (
			canvasInUrl === 'edit' &&
			currentCanvasMode.current !== 'edit'
		) {
			setCanvasMode( 'edit' );
		}
	}, [ canvasInUrl, params ] );
}
