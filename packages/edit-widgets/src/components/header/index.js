/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
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

function Header( { isCustomizer } ) {
	const isLargeViewport = useViewportMatch( 'medium' );
	const rootClientId = useLastSelectedRootId();
	const isLastSelectedWidgetAreaOpen = useSelect(
		( select ) =>
			select( 'core/edit-widgets' ).getIsWidgetAreaOpen( rootClientId ),
		[ rootClientId ]
	);
	const { setIsWidgetAreaOpen } = useDispatch( 'core/edit-widgets' );

	function handleInserterOpen( isOpen ) {
		// Open the last selected widget area when opening the inserter.
		if ( isOpen && ! isLastSelectedWidgetAreaOpen ) {
			setIsWidgetAreaOpen( rootClientId, isOpen );
		}
	}

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
								onToggle={ handleInserterOpen }
							/>
						) }
					</ToolbarItem>
					<ToolbarItem as={ UndoButton } />
					<ToolbarItem as={ RedoButton } />
					<ToolbarItem as={ BlockNavigationDropdown } />
				</NavigableToolbar>
				{ ! isCustomizer && (
					<h1 className="edit-widgets-header__title">
						{ __( 'Block Areas' ) }
					</h1>
				) }
				<div className="edit-widgets-header__actions">
					{ ! isCustomizer && <SaveButton /> }
					<PinnedItems.Slot
						scope={
							isCustomizer
								? 'core/edit-widgets-customizer'
								: 'core/edit-widgets'
						}
					/>
				</div>
			</div>
			{ ( ! isLargeViewport || isCustomizer ) && (
				<div className="edit-widgets-header__block-toolbar">
					<BlockToolbar hideDragHandle />
				</div>
			) }
		</>
	);
}

export default Header;
