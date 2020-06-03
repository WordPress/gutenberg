/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { NavigableMenu } from '@wordpress/components';
import {
	BlockNavigationDropdown,
	BlockToolbar,
	Inserter,
} from '@wordpress/block-editor';
import { PinnedItems } from '@wordpress/interface';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import SaveButton from '../save-button';
import UndoButton from './undo-redo/undo';
import RedoButton from './undo-redo/redo';

const inserterToggleProps = { isPrimary: true };

function Header( { isCustomizer } ) {
	const isLargeViewport = useViewportMatch( 'medium' );
	return (
		<>
			<div className="edit-widgets-header">
				<NavigableMenu>
					<Inserter
						position="bottom right"
						showInserterHelpPanel
						toggleProps={ inserterToggleProps }
					/>
					<UndoButton />
					<RedoButton />
					<BlockNavigationDropdown />
				</NavigableMenu>
				{ ! isCustomizer && (
					<h1 className="edit-widgets-header__title">
						{ __( 'Block Areas' ) } { __( '(experimental)' ) }
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
