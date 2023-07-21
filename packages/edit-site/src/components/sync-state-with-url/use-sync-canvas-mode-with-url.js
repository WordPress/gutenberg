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
	const currentCanvasMode = useRef( canvasMode );
	const { canvas: canvasInUrl } = params;
	const currentCanvasInUrl = useRef( canvasInUrl );
	const currentUrlParams = useRef( params );
	useEffect( () => {
		currentUrlParams.current = params;
	}, [ params ] );

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
				...currentUrlParams.current,
				canvas: 'edit',
			} );
		}

		if (
			canvasMode === 'view' &&
			currentCanvasInUrl.current !== undefined
		) {
			history.push( {
				...currentUrlParams.current,
				canvas: undefined,
			} );
		}
	}, [ canvasMode, history ] );

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
	}, [ canvasInUrl, setCanvasMode ] );
}
