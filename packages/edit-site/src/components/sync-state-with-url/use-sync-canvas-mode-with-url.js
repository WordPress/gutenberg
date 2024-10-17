/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { useLocation, useHistory } = unlock( routerPrivateApis );

export default function useSyncCanvasModeWithURL() {
	const history = useHistory();
	const { params } = useLocation();
	const canvasMode = useSelect(
		( select ) => unlock( select( editSiteStore ) ).getCanvasMode(),
		[]
	);
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );
	const currentCanvasModeRef = useRef( canvasMode );
	const { canvas: canvasInUrl } = params;
	const currentCanvasInUrlRef = useRef( canvasInUrl );
	const currentUrlParamsRef = useRef( params );
	useEffect( () => {
		currentUrlParamsRef.current = params;
	}, [ params ] );

	useEffect( () => {
		currentCanvasModeRef.current = canvasMode;
		if ( canvasMode === 'init' ) {
			return;
		}

		if (
			canvasMode === 'edit' &&
			currentCanvasInUrlRef.current !== canvasMode
		) {
			history.push( {
				...currentUrlParamsRef.current,
				canvas: 'edit',
			} );
		}

		if (
			canvasMode === 'view' &&
			currentCanvasInUrlRef.current !== undefined
		) {
			history.push( {
				...currentUrlParamsRef.current,
				canvas: undefined,
			} );
		}
	}, [ canvasMode, history ] );

	useEffect( () => {
		currentCanvasInUrlRef.current = canvasInUrl;
		if (
			canvasInUrl !== 'edit' &&
			currentCanvasModeRef.current !== 'view'
		) {
			setCanvasMode( 'view' );
		} else if (
			canvasInUrl === 'edit' &&
			currentCanvasModeRef.current !== 'edit'
		) {
			setCanvasMode( 'edit' );
		}
	}, [ canvasInUrl, setCanvasMode ] );
}
