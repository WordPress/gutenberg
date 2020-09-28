/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';
import { Button, ToolbarItem } from '@wordpress/components';
import {
	BlockNavigationDropdown,
	BlockToolbar,
	NavigableToolbar,
} from '@wordpress/block-editor';
import { PinnedItems } from '@wordpress/interface';
import { useViewportMatch } from '@wordpress/compose';
import { plus } from '@wordpress/icons';
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SaveButton from '../save-button';
import UndoButton from './undo-redo/undo';
import RedoButton from './undo-redo/redo';
import useLastSelectedRootId from '../../hooks/use-last-selected-root-id';

function Header() {
	const inserterButton = useRef();
	const isLargeViewport = useViewportMatch( 'medium' );
	const isLastSelectedWidgetAreaOpen = useSelect(
		( select ) =>
			select( 'core/edit-widgets' ).getIsWidgetAreaOpen( rootClientId ),
		[ rootClientId ]
	);
	const isInserterOpened = useSelect( ( select ) =>
		select( 'core/edit-widgets' ).isInserterOpened()
	);
	const { setIsWidgetAreaOpen, setIsInserterOpened } = useDispatch(
		'core/edit-widgets'
	);
	const { selectBlock } = useDispatch( 'core/block-editor' );
	const rootClientId = useLastSelectedRootId();

	return (
		<>
			<div className="edit-widgets-header">
				<div>
					<h1 className="edit-widgets-header__title">
						{ __( 'Widgets' ) }
					</h1>
					<NavigableToolbar
						className="edit-widgets-header-toolbar"
						aria-label={ __( 'Document tools' ) }
					>
						<ToolbarItem
							ref={ inserterButton }
							as={ Button }
							className="edit-widgets-header-toolbar__inserter-toggle"
							isPrimary
							isPressed={ isInserterOpened }
							onMouseDown={ ( event ) => {
								event.preventDefault();
							} }
							onClick={ () => {
								if ( isInserterOpened ) {
									// Focusing the inserter button closes the inserter popover
									inserterButton.current.focus();
								} else {
									if ( ! isLastSelectedWidgetAreaOpen ) {
										// Select the last selected block if hasn't already.
										selectBlock( rootClientId );
										// Open the last selected widget area when opening the inserter.
										setIsWidgetAreaOpen(
											rootClientId,
											true
										);
									}
									// eslint-disable-next-line @wordpress/react-no-unsafe-timeout
									setTimeout( () =>
										setIsInserterOpened( true )
									);
								}
							} }
							icon={ plus }
							/* translators: button label text should, if possible, be under 16
					characters. */
							label={ _x(
								'Add block',
								'Generic label for block inserter button'
							) }
						/>
						<ToolbarItem as={ UndoButton } />
						<ToolbarItem as={ RedoButton } />
						<ToolbarItem as={ BlockNavigationDropdown } />
					</NavigableToolbar>
				</div>
				<div className="edit-widgets-header__actions">
					<SaveButton />
					<PinnedItems.Slot scope="core/edit-widgets" />
				</div>
			</div>
			{ ! isLargeViewport && (
				<div className="edit-widgets-header__block-toolbar">
					<BlockToolbar hideDragHandle />
				</div>
			) }
		</>
	);
}

export default Header;
