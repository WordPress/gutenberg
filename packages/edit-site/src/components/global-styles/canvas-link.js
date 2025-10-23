/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { usePrevious } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';

/**
 * Synchronize editor canvas container view with global styles navigation.
 *
 * @param {Object}   props
 * @param {string}   props.path         Current navigation path.
 * @param {Function} props.onPathChange Callback to change the navigation path.
 */
export function GlobalStylesEditorCanvasContainerLink( {
	path,
	onPathChange,
} ) {
	const editorCanvasContainerView = useSelect(
		( select ) =>
			unlock( select( editSiteStore ) ).getEditorCanvasContainerView(),
		[]
	);
	const { setEditorCanvasContainerView } = unlock(
		useDispatch( editSiteStore )
	);
	const isRevisionsOpen = path === '/revisions';
	const previousEditorCanvasContainerView = usePrevious(
		editorCanvasContainerView
	);
	const previousPath = usePrevious( path );

	// If the user switches the editor canvas container view, redirect
	// to the appropriate screen. This effectively allows deep linking to the
	// desired screens from outside the global styles navigation provider.
	useEffect( () => {
		// Only trigger navigation if the view actually changed
		if ( editorCanvasContainerView === previousEditorCanvasContainerView ) {
			return;
		}

		switch ( editorCanvasContainerView ) {
			case 'global-styles-revisions':
			case 'global-styles-revisions:style-book':
				if ( ! isRevisionsOpen ) {
					onPathChange?.( '/revisions' );
				}
				break;
			case 'global-styles-css':
				onPathChange?.( '/css' );
				break;
			// The stand-alone style book is open
			// and the revisions panel is open,
			// close the revisions panel.
			// Otherwise keep the style book open while
			// browsing global styles panel.
			case 'style-book':
			default:
				// In general, if the revision screen is in view but the
				// `editorCanvasContainerView` is not a revision view, close it.
				// This also includes the scenario when the stand-alone style
				// book is open, in which case we want the user to close the
				// revisions screen and browse global styles.
				if ( isRevisionsOpen ) {
					onPathChange?.( '/' );
				}
				break;
		}
	}, [
		editorCanvasContainerView,
		previousEditorCanvasContainerView,
		isRevisionsOpen,
		onPathChange,
	] );

	useEffect( () => {
		// Only clear if path actually changed
		if ( path === previousPath ) {
			return;
		}

		// If user navigated away from CSS screen, clear the canvas view
		if ( previousPath === '/css' && path !== '/css' ) {
			setEditorCanvasContainerView( undefined );
		}
		// If user navigated away from revisions screen, clear the canvas view
		else if (
			previousPath?.startsWith( '/revisions' ) &&
			! path?.startsWith( '/revisions' ) &&
			editorCanvasContainerView &&
			editorCanvasContainerView.startsWith( 'global-styles-revisions' )
		) {
			// If stylebook was open with revisions, keep it open
			if (
				editorCanvasContainerView ===
				'global-styles-revisions:style-book'
			) {
				setEditorCanvasContainerView( 'style-book' );
			} else {
				setEditorCanvasContainerView( undefined );
			}
		}
	}, [
		path,
		previousPath,
		editorCanvasContainerView,
		setEditorCanvasContainerView,
	] );

	return null;
}
