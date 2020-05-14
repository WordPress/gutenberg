/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { NavigableMenu } from '@wordpress/components';

/**
 * Internal dependencies
 */
import Inserter from '../inserter';
import SaveButton from '../save-button';
import UndoButton from './undo-redo/undo';
import RedoButton from './undo-redo/redo';

function Header() {
	return (
		<div className="edit-widgets-header">
			<NavigableMenu>
				<Inserter.Slot className="edit-widgets-inserter" />
				<UndoButton />
				<RedoButton />
			</NavigableMenu>
			<h1 className="edit-widgets-header__title">
				{ __( 'Block Areas' ) } { __( '(experimental)' ) }
			</h1>
			<div className="edit-widgets-header__actions">
				<SaveButton />
			</div>
		</div>
	);
}

export default Header;
