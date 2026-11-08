import clsx from 'clsx';
import { Button, ToolbarItem } from '@wordpress/components';
import { NavigableToolbar } from '@wordpress/block-editor';
import { createPortal, useEffect, useState } from '@wordpress/element';
import { displayShortcut, isAppleOS } from '@wordpress/keycodes';
import { __, _x, isRTL } from '@wordpress/i18n';
import { plus, undo as undoIcon, redo as redoIcon } from '@wordpress/icons';
import Inserter from '../inserter';
import MoreMenu from '../more-menu';

function Header( {
	sidebar,
	inserter,
	isInserterOpened,
	setIsInserterOpened,
	isFixedToolbarActive,
} ) {
	const [ [ hasUndo, hasRedo ], setUndoRedo ] = useState( [
		sidebar.hasUndo(),
		sidebar.hasRedo(),
	] );

	const shortcut = isAppleOS()
		? displayShortcut.primaryShift( 'z' )
		: displayShortcut.primary( 'y' );

	useEffect( () => {
		return sidebar.subscribeHistory( () => {
			setUndoRedo( [ sidebar.hasUndo(), sidebar.hasRedo() ] );
		} );
	}, [ sidebar ] );

	return (
		<>
			<div
				className={ clsx( 'customize-widgets-header', {
					'is-fixed-toolbar-active': isFixedToolbarActive,
				} ) }
			>
				<NavigableToolbar
					className="customize-widgets-header-toolbar"
					aria-label={ __( 'Document tools' ) }
				>
					<ToolbarItem
						as={ Button }
						icon={ ! isRTL() ? undoIcon : redoIcon }
						/* translators: button label text should, if possible, be under 16 characters. */
						label={ __( 'Undo' ) }
						shortcut={ displayShortcut.primary( 'z' ) }
						// If there are no undo levels we don't want to actually disable this
						// button, because it will remove focus for keyboard users.
						// See: https://github.com/WordPress/gutenberg/issues/3486
						aria-disabled={ ! hasUndo }
						onClick={ hasUndo ? sidebar.undo : undefined }
						size="compact"
						className="customize-widgets-editor-history-button undo-button"
					/>
					<ToolbarItem
						as={ Button }
						icon={ ! isRTL() ? redoIcon : undoIcon }
						/* translators: button label text should, if possible, be under 16 characters. */
						label={ __( 'Redo' ) }
						shortcut={ shortcut }
						// If there are no redo levels we don't want to actually disable this
						// button, because it will remove focus for keyboard users.
						// See: https://github.com/WordPress/gutenberg/issues/3486
						aria-disabled={ ! hasRedo }
						onClick={ hasRedo ? sidebar.redo : undefined }
						size="compact"
						className="customize-widgets-editor-history-button redo-button"
					/>

					<ToolbarItem
						as={ Button }
						className="customize-widgets-header-toolbar__inserter-toggle"
						isPressed={ isInserterOpened }
						variant="primary"
						icon={ plus }
						label={ _x(
							'Add block',
							'Generic label for block inserter button'
						) }
						onClick={ () => {
							setIsInserterOpened( ( isOpen ) => ! isOpen );
						} }
						size="compact"
					/>
					<MoreMenu />
				</NavigableToolbar>
			</div>

			{ createPortal(
				<Inserter setIsOpened={ setIsInserterOpened } />,
				inserter.contentContainer[ 0 ]
			) }
		</>
	);
}

export default Header;
