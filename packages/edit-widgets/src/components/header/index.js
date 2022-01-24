/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';
import { Button, ToolbarItem, VisuallyHidden } from '@wordpress/components';
import {
	NavigableToolbar,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { PinnedItems } from '@wordpress/interface';
import { listView, plus } from '@wordpress/icons';
import { useCallback, useRef } from '@wordpress/element';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import SaveButton from '../save-button';
import UndoButton from './undo-redo/undo';
import RedoButton from './undo-redo/redo';
import MoreMenu from '../more-menu';
import useLastSelectedWidgetArea from '../../hooks/use-last-selected-widget-area';
import { store as editWidgetsStore } from '../../store';

function Header() {
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
	const { isInserterOpen, isListViewOpen } = useSelect( ( select ) => {
		const { isInserterOpened, isListViewOpened } = select(
			editWidgetsStore
		);
		return {
			isInserterOpen: isInserterOpened(),
			isListViewOpen: isListViewOpened(),
		};
	}, [] );
	const {
		setIsWidgetAreaOpen,
		setIsInserterOpened,
		setIsListViewOpened,
	} = useDispatch( editWidgetsStore );
	const { selectBlock } = useDispatch( blockEditorStore );
	const handleClick = () => {
		if ( isInserterOpen ) {
			// Focusing the inserter button closes the inserter popover
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
		<>
			<div className="edit-widgets-header">
				<div className="edit-widgets-header__navigable-toolbar-wrapper">
					{ isMediumViewport && (
						<h1 className="edit-widgets-header__title">
							{ __( 'Widgets' ) }
						</h1>
					) }
					{ ! isMediumViewport && (
						<VisuallyHidden
							as="h1"
							className="edit-widgets-header__title"
						>
							{ __( 'Widgets' ) }
						</VisuallyHidden>
					) }
					<NavigableToolbar
						className="edit-widgets-header-toolbar"
						aria-label={ __( 'Document tools' ) }
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
						/>
						{ isMediumViewport && (
							<>
								<UndoButton />
								<RedoButton />
								<ToolbarItem
									as={ Button }
									className="edit-widgets-header-toolbar__list-view-toggle"
									icon={ listView }
									isPressed={ isListViewOpen }
									/* translators: button label text should, if possible, be under 16 characters. */
									label={ __( 'List View' ) }
									onClick={ toggleListView }
								/>
							</>
						) }
					</NavigableToolbar>
				</div>
				<div className="edit-widgets-header__actions">
					<SaveButton />
					<PinnedItems.Slot scope="core/edit-widgets" />
					<MoreMenu />
				</div>
			</div>
		</>
	);
}

export default Header;
