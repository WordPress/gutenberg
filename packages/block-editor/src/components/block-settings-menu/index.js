/**
 * External dependencies
 */
import { castArray, flow } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, _n } from '@wordpress/i18n';
import {
	Toolbar,
	DropdownMenu,
	MenuGroup,
	MenuItem,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { displayShortcut } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import BlockActions from '../block-actions';
import BlockModeToggle from './block-mode-toggle';
import BlockHTMLConvertButton from './block-html-convert-button';
import BlockUnknownConvertButton from './block-unknown-convert-button';
import __experimentalBlockSettingsMenuFirstItem from './block-settings-menu-first-item';
import __experimentalBlockSettingsMenuPluginsExtension from './block-settings-menu-plugins-extension';

const POPOVER_PROPS = {
	className: 'block-editor-block-settings-menu__popover',
	position: 'bottom right',
};

export function BlockSettingsMenu( { clientIds } ) {
	const blockClientIds = castArray( clientIds );
	const count = blockClientIds.length;
	const firstBlockClientId = blockClientIds[ 0 ];

	const shortcuts = useSelect( ( select ) => {
		const { getShortcutKeyCombination } = select( 'core/keyboard-shortcuts' );
		return {
			duplicate: getShortcutKeyCombination( 'core/block-editor/duplicate' ),
			remove: getShortcutKeyCombination( 'core/block-editor/remove' ),
			insertAfter: getShortcutKeyCombination( 'core/block-editor/insert-after' ),
			insertBefore: getShortcutKeyCombination( 'core/block-editor/insert-before' ),
		};
	}, [] );

	const getShortcutDisplay = ( shortcut ) => {
		if ( ! shortcut ) {
			return null;
		}
		return shortcut.modifier ?
			displayShortcut[ shortcut.modifier ]( shortcut.character ) :
			shortcut.character;
	};

	return (
		<BlockActions clientIds={ clientIds }>
			{ ( {
				canDuplicate,
				canInsertDefaultBlock,
				isLocked,
				onDuplicate,
				onInsertAfter,
				onInsertBefore,
				onRemove,
			} ) => (
				<Toolbar>
					<DropdownMenu
						icon="ellipsis"
						label={ __( 'More options' ) }
						className="block-editor-block-settings-menu"
						popoverProps={ POPOVER_PROPS }
					>
						{ ( { onClose } ) => (
							<>
								<MenuGroup>
									<__experimentalBlockSettingsMenuFirstItem.Slot
										fillProps={ { onClose } }
									/>
									{ count === 1 && (
										<BlockUnknownConvertButton
											clientId={ firstBlockClientId }
										/>
									) }
									{ count === 1 && (
										<BlockHTMLConvertButton
											clientId={ firstBlockClientId }
										/>
									) }
									{ canDuplicate && (
										<MenuItem
											className="block-editor-block-settings-menu__control"
											onClick={ flow( onClose, onDuplicate ) }
											icon="admin-page"
											shortcut={ getShortcutDisplay( shortcuts.duplicate ) }
										>
											{ __( 'Duplicate' ) }
										</MenuItem>
									) }
									{ canInsertDefaultBlock && (
										<>
											<MenuItem
												className="block-editor-block-settings-menu__control"
												onClick={ flow( onClose, onInsertBefore ) }
												icon="insert-before"
												shortcut={ getShortcutDisplay( shortcuts.insertBefore ) }
											>
												{ __( 'Insert Before' ) }
											</MenuItem>
											<MenuItem
												className="block-editor-block-settings-menu__control"
												onClick={ flow( onClose, onInsertAfter ) }
												icon="insert-after"
												shortcut={ getShortcutDisplay( shortcuts.insertAfter ) }
											>
												{ __( 'Insert After' ) }
											</MenuItem>
										</>
									) }
									{ count === 1 && (
										<BlockModeToggle
											clientId={ firstBlockClientId }
											onToggle={ onClose }
										/>
									) }
									<__experimentalBlockSettingsMenuPluginsExtension.Slot
										fillProps={ { clientIds, onClose } }
									/>
								</MenuGroup>
								<MenuGroup>
									{ ! isLocked && (
										<MenuItem
											className="block-editor-block-settings-menu__control"
											onClick={ flow( onClose, onRemove ) }
											icon="trash"
											shortcut={ getShortcutDisplay( shortcuts.remove ) }
										>
											{ _n( 'Remove Block', 'Remove Blocks', count ) }
										</MenuItem>
									) }
								</MenuGroup>
							</>
						) }
					</DropdownMenu>
				</Toolbar>
			) }
		</BlockActions>
	);
}

export default BlockSettingsMenu;
