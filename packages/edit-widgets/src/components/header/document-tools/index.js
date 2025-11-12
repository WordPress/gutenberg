/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';
import { Button, ToolbarItem } from '@wordpress/components';
import { NavigableToolbar } from '@wordpress/block-editor';
import { listView, plus } from '@wordpress/icons';
import { useCallback } from '@wordpress/element';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import UndoButton from '../undo-redo/undo';
import RedoButton from '../undo-redo/redo';
import { store as editWidgetsStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

function DocumentTools() {
	const isMediumViewport = useViewportMatch( 'medium' );

	const {
		isInserterOpen,
		isListViewOpen,
		inserterSidebarToggleRef,
		listViewToggleRef,
	} = useSelect( ( select ) => {
		const {
			isInserterOpened,
			getInserterSidebarToggleRef,
			isListViewOpened,
			getListViewToggleRef,
		} = unlock( select( editWidgetsStore ) );
		return {
			isInserterOpen: isInserterOpened(),
			isListViewOpen: isListViewOpened(),
			inserterSidebarToggleRef: getInserterSidebarToggleRef(),
			listViewToggleRef: getListViewToggleRef(),
		};
	}, [] );
	const { setIsInserterOpened, setIsListViewOpened } =
		useDispatch( editWidgetsStore );

	const toggleListView = useCallback(
		() => setIsListViewOpened( ! isListViewOpen ),
		[ setIsListViewOpened, isListViewOpen ]
	);

	const toggleInserterSidebar = useCallback(
		() => setIsInserterOpened( ! isInserterOpen ),
		[ setIsInserterOpened, isInserterOpen ]
	);

	return (
		<NavigableToolbar
			className="edit-widgets-header-toolbar"
			aria-label={ __( 'Document tools' ) }
			variant="unstyled"
		>
			<ToolbarItem
				ref={ inserterSidebarToggleRef }
				as={ Button }
				className="edit-widgets-header-toolbar__inserter-toggle"
				variant="primary"
				isPressed={ isInserterOpen }
				onMouseDown={ ( event ) => {
					event.preventDefault();
				} }
				onClick={ toggleInserterSidebar }
				icon={ plus }
				/* translators: button label text should, if possible, be under 16
					characters. */
				label={ _x(
					'Block Inserter',
					'Generic label for block inserter button'
				) }
				size="compact"
			/>
			{ isMediumViewport && (
				<>
					<ToolbarItem as={ UndoButton } />
					<ToolbarItem as={ RedoButton } />
					<ToolbarItem
						as={ Button }
						className="edit-widgets-header-toolbar__list-view-toggle"
						icon={ listView }
						isPressed={ isListViewOpen }
						/* translators: button label text should, if possible, be under 16 characters. */
						label={ __( 'List View' ) }
						onClick={ toggleListView }
						ref={ listViewToggleRef }
						size="compact"
					/>
				</>
			) }
		</NavigableToolbar>
	);
}

export default DocumentTools;
