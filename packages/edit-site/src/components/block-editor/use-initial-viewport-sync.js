/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useLocation } = unlock( routerPrivateApis );

const VALID_VIEWPORTS = [ 'desktop', 'tablet', 'mobile' ];
const VIEWPORT_TO_DEVICE_TYPE = {
	desktop: 'Desktop',
	tablet: 'Tablet',
	mobile: 'Mobile',
};

/**
 * Syncs the editor's device type with the `viewport` URL query param when present.
 * Used to open the editor in a specific viewport (e.g. mobile for overlay template parts).
 * Runs once on mount when a valid viewport param is in the URL.
 */
export default function useInitialViewportSync() {
	const { query } = useLocation();
	const { setDeviceType } = useDispatch( editorStore );

	useEffect( () => {
		const viewport = query?.viewport;
		if (
			! viewport ||
			typeof viewport !== 'string' ||
			! VALID_VIEWPORTS.includes( viewport.toLowerCase() )
		) {
			return;
		}

		const deviceType = VIEWPORT_TO_DEVICE_TYPE[ viewport.toLowerCase() ];
		if ( deviceType ) {
			setDeviceType( deviceType );
		}
	}, [ query?.viewport, setDeviceType ] );
}

/**
 * Component wrapper that runs the viewport sync hook.
 * Renders nothing; used to run the hook inside the Editor tree (inside EditorProvider).
 */
export function InitialViewportSync() {
	useInitialViewportSync();
	return null;
}
