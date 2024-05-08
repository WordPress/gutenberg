/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';
import { Button, ToolbarItem } from '@wordpress/components';
import {
	NavigableToolbar,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { listView, plus } from '@wordpress/icons';
import { useCallback, useRef } from '@wordpress/element';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import UndoButton from '../undo-redo/undo';
import RedoButton from '../undo-redo/redo';
import useLastSelectedWidgetArea from '../../../hooks/use-last-selected-widget-area';
import { store as editWidgetsStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

function DocumentTools() {
	const isMediumViewport = useViewportMatch( 'medium' );
	const inserterButton = useRef();
	const widgetAreaClientId = useLastSelectedWidgetArea();
	const isLastSelectedWidgetAreaOpen = useSelect(
		( select ) =>
			select( editWidgetsStore ).getIsWidgetAreaOpen(
				widgetAreaClientId
			),
		[ widgetAreaClientId ]
	);
	const { isInserterOpen, isListViewOpen, listViewToggleRef } = useSelect(
		( select ) => {
			const { isInserterOpened, isListViewOpened, getListViewToggleRef } =
				unlock( select( editWidgetsStore ) );
			return {
				isInserterOpen: isInserterOpened(),
				isListViewOpen: isListViewOpened(),
				listViewToggleRef: getListViewToggleRef(),
			};
		},
		[]
	);
	const { setIsWidgetAreaOpen, setIsInserterOpened, setIsListViewOpened } =
		useDispatch( editWidgetsStore );
	const { selectBlock } = useDispatch( blockEditorStore );
	const handleClick = () => {
		if ( isInserterOpen ) {
			// Focusing the inserter button closes the inserter popover.
			setIsInserterOpened( false );
		} else {
			if ( ! isLastSelectedWidgetAreaOpen ) {
				// Select the last selected block if hasn't already.
				selectBlock( widgetAreaClientId );
				// Open the last selected widget area when opening the inserter.
				setIsWidgetAreaOpen( widgetAreaClientId, true );
			}
			// The DOM updates resulting from selectBlock() and setIsInserterOpened() calls are applied the
			// same tick and pretty much in a random order. The inserter is closed if any other part of the
			// app receives focus. If selectBlock() happens to take effect after setIsInserterOpened() then
			// the inserter is visible for a brief moment and then gets auto-closed due to focus moving to
			// the selected block.
			window.requestAnimationFrame( () => setIsInserterOpened( true ) );
		}
	};

	const toggleListView = useCallback(
		() => setIsListViewOpened( ! isListViewOpen ),
		[ setIsListViewOpened, isListViewOpen ]
	);

	return (
		<NavigableToolbar
			className="edit-widgets-header-toolbar"
			aria-label={ __( 'Document tools' ) }
			variant="unstyled"
		>
			<ToolbarItem
				ref={ inserterButton }
				as={ Button }
				className="edit-widgets-header-toolbar__inserter-toggle"
				variant="primary"
				isPressed={ isInserterOpen }
				onMouseDown={ ( event ) => {
					event.preventDefault();
				} }
				onClick={ handleClick }
				icon={ plus }
				/* translators: button label text should, if possible, be under 16
					characters. */
				label={ _x(
					'Toggle block inserter',
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
