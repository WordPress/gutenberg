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

export const DEFAULT_DEVICE_TYPE = 'Desktop';

// URL viewport params are lowercase; the editor store uses PascalCase.
const capitalize = ( str ) => str.charAt( 0 ).toUpperCase() + str.slice( 1 );

/**
 * Syncs the editor's device type with the `viewport` URL query param.
 */
export default function useInitialViewportSync() {
	const { query } = useLocation();
	const { setDeviceType } = useDispatch( editorStore );

	useEffect( () => {
		const viewport = query?.viewport?.toLowerCase();
		const isValid = [ 'desktop', 'tablet', 'mobile' ].includes( viewport );

		setDeviceType( isValid ? capitalize( viewport ) : DEFAULT_DEVICE_TYPE );
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
