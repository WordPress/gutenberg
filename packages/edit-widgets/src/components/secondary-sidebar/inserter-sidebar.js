/**
 * WordPress dependencies
 */
import { __experimentalLibrary as Library } from '@wordpress/block-editor';
import { useViewportMatch } from '@wordpress/compose';
import { useCallback, useRef } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import useWidgetLibraryInsertionPoint from '../../hooks/use-widget-library-insertion-point';
import { store as editWidgetsStore } from '../../store';
import { unlock } from '../../lock-unlock';

export default function InserterSidebar() {
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const { rootClientId, insertionIndex } = useWidgetLibraryInsertionPoint();

	const inserterSidebarToggleRef = useSelect( ( select ) => {
		return unlock(
			select( editWidgetsStore )
		).getInserterSidebarToggleRef();
	}, [] );

	const { setIsInserterOpened } = useDispatch( editWidgetsStore );

	const closeInserter = useCallback( () => {
		setIsInserterOpened( false );
		inserterSidebarToggleRef.current?.focus();
	}, [ setIsInserterOpened, inserterSidebarToggleRef ] );

	const closeOnEscape = useCallback(
		( event ) => {
			if ( event.keyCode === ESCAPE && ! event.defaultPrevented ) {
				event.preventDefault();
				closeInserter();
			}
		},
		[ closeInserter ]
	);

	const libraryRef = useRef();

	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			className="edit-widgets-layout__inserter-panel"
			onKeyDown={ closeOnEscape }
		>
			<div className="edit-widgets-layout__inserter-panel-content">
				<Library
					showInserterHelpPanel
					shouldFocusBlock={ isMobileViewport }
					rootClientId={ rootClientId }
					__experimentalInsertionIndex={ insertionIndex }
					ref={ libraryRef }
					onClose={ closeInserter }
				/>
			</div>
		</div>
	);
}
