/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { NavigableMenu } from '@wordpress/components';
import { BlockNavigationDropdown, Inserter } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import SaveButton from '../save-button';
import UndoButton from './undo-redo/undo';
import RedoButton from './undo-redo/redo';

const inserterToggleProps = { isPrimary: true };

function Header() {
	return (
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
