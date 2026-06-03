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

// Lowercase values for URL params. Duplicated from block-editor block-visibility constants
// and editor preview-dropdown choices. See those files when adding new viewport types.
const VALID_DEVICE_TYPES = [ 'desktop', 'tablet', 'mobile' ];

// URL viewport params are lowercase; the editor store uses PascalCase.
const capitalize = ( str ) => str.charAt( 0 ).toUpperCase() + str.slice( 1 );

/**
 * Syncs the editor's device type with the `viewport` URL query param.
 *
 * Intentionally responds to ongoing URL changes (not just initial load) so that
 * viewport is restored correctly when navigating back (e.g. from overlay template
 * part editor to the previous entity).
 */
export default function useViewportSync() {
	const { query } = useLocation();
	const { setDeviceType } = useDispatch( editorStore );

	useEffect( () => {
		const viewport = query?.viewport?.toLowerCase();
		const isValid = VALID_DEVICE_TYPES.includes( viewport );

		setDeviceType( isValid ? capitalize( viewport ) : DEFAULT_DEVICE_TYPE );
	}, [ query?.viewport, setDeviceType ] );
}

/**
 * Component wrapper that runs the viewport sync hook.
 * Renders nothing; used to run the hook inside the Editor tree (inside EditorProvider).
 */
export function ViewportSync() {
	useViewportSync();
	return null;
}
