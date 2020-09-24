/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToolbarItem } from '@wordpress/components';
import {
	BlockNavigationDropdown,
	BlockToolbar,
	Inserter,
	NavigableToolbar,
} from '@wordpress/block-editor';
import { PinnedItems } from '@wordpress/interface';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import SaveButton from '../save-button';
import useLastSelectedRootId from '../../hooks/use-last-selected-root-id';
import UndoButton from './undo-redo/undo';
import RedoButton from './undo-redo/redo';

const inserterToggleProps = { isPrimary: true };

function Header() {
	const isLargeViewport = useViewportMatch( 'medium' );
	const rootClientId = useLastSelectedRootId();

	return (
		<>
			<div className="edit-widgets-header">
				<NavigableToolbar
					className="edit-widgets-header-toolbar"
					aria-label={ __( 'Document tools' ) }
				>
					<ToolbarItem>
						{ ( toolbarItemProps ) => (
							<Inserter
								position="bottom right"
								showInserterHelpPanel
								toggleProps={ {
									...inserterToggleProps,
									...toolbarItemProps,
								} }
								rootClientId={ rootClientId }
							/>
						) }
					</ToolbarItem>
					<ToolbarItem as={ UndoButton } />
					<ToolbarItem as={ RedoButton } />
					<ToolbarItem as={ BlockNavigationDropdown } />
				</NavigableToolbar>
				<h1 className="edit-widgets-header__title">
					{ __( 'Block Areas' ) }
				</h1>
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
