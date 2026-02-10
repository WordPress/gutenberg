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
 * Syncs the editor's device type with the `viewport` URL query param.
 * - When viewport is in the URL and valid: use it (e.g. mobile when editing a specific entity).
 * - When no viewport or invalid: default to Desktop (full-size viewport), e.g. when
 *   returning from a focused entity editor without a saved viewport.
 */
export default function useInitialViewportSync() {
	const { query } = useLocation();
	const { setDeviceType } = useDispatch( editorStore );

	useEffect( () => {
		const viewport = query?.viewport;
		const isValidViewport =
			viewport &&
			typeof viewport === 'string' &&
			VALID_VIEWPORTS.includes( viewport.toLowerCase() );

		const deviceType = isValidViewport
			? VIEWPORT_TO_DEVICE_TYPE[ viewport.toLowerCase() ]
			: 'Desktop';

		setDeviceType( deviceType );
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
