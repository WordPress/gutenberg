import { useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as editorStore } from '@wordpress/editor';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { addQueryArgs, removeQueryArgs } from '@wordpress/url';
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';

const { useLocation, useHistory } = unlock( routerPrivateApis );

/**
 * Returns callbacks that switch the site editor from browsing the Styles
 * route into editing it, either at the root of the Styles panel or straight
 * into its revisions screen.
 *
 * @return Callbacks that open the Styles panel or its revisions screen.
 */
export default function useOpenGlobalStylesRevisions(): {
	openGlobalStyles: () => Promise< unknown >;
	openRevisions: () => Promise< void >;
} {
	const history = useHistory();
	const { path, query } = useLocation();
	const { openGeneralSidebar } = useDispatch( editSiteStore );
	const { setStylesPath, setShowStylebook } = unlock(
		useDispatch( editorStore )
	);
	const { set: setPreference } = useDispatch( preferencesStore );

	const openGlobalStyles = useCallback( async () => {
		// The style book preview replaces the editor, so it can't stay in
		// the URL when the editor opens.
		history.navigate(
			addQueryArgs( removeQueryArgs( path, 'preview' ), {
				canvas: 'edit',
			} ),
			{
				transition: 'canvas-mode-edit-transition',
			}
		);
		return Promise.all( [
			setPreference( 'core', 'distractionFree', false ),
			openGeneralSidebar( 'edit-site/global-styles' ),
		] );
	}, [ path, history, openGeneralSidebar, setPreference ] );

	const openRevisions = useCallback( async () => {
		// Select revisions before opening the sidebar. The sidebar resets its
		// navigation as it opens, so a path set afterwards would be discarded.
		setStylesPath( '/revisions' );
		if ( query.preview === 'stylebook' ) {
			setShowStylebook( true );
		}
		await openGlobalStyles();
	}, [ openGlobalStyles, setStylesPath, setShowStylebook, query.preview ] );

	return { openGlobalStyles, openRevisions };
}
