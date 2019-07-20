/**
 * External dependencies
 */
import { castArray, flow } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Toolbar,
	DropdownMenu,
	MenuGroup,
	MenuItem,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { shortcuts } from '../block-editor-keyboard-shortcuts';
import BlockActions from '../block-actions';
import BlockModeToggle from './block-mode-toggle';
import BlockHTMLConvertButton from './block-html-convert-button';
import BlockUnknownConvertButton from './block-unknown-convert-button';
import __experimentalBlockSettingsMenuFirstItem from './block-settings-menu-first-item';
import __experimentalBlockSettingsMenuPluginsExtension from './block-settings-menu-plugins-extension';

export function BlockSettingsMenu( { clientIds } ) {
	const blockClientIds = castArray( clientIds );
	const count = blockClientIds.length;
	const firstBlockClientId = blockClientIds[ 0 ];

	return (
		<BlockActions clientIds={ clientIds }>
			{ ( { onDuplicate, onRemove, onInsertAfter, onInsertBefore, canDuplicate, templateLock } ) => (
				<Toolbar>
					<DropdownMenu
						icon="ellipsis"
						label={ __( 'More options' ) }
						position="bottom right"
						className="block-editor-block-settings-menu"
						__unstableToggleClassName="block-editor-block-settings-menu__toggle editor-block-settings-menu__toggle"
						__unstableMenuClassName="block-editor-block-settings-menu__content editor-block-settings-menu__content"
						__unstablePopoverClassName="block-editor-block-settings-menu__popover editor-block-settings-menu__popover"
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
									{ ! templateLock.has( 'insert' ) && canDuplicate && (
										<MenuItem
											className="editor-block-settings-menu__control block-editor-block-settings-menu__control"
											onClick={ flow( onClose, onDuplicate ) }
											icon="admin-page"
											shortcut={ shortcuts.duplicate.display }
										>
											{ __( 'Duplicate' ) }
										</MenuItem>
									) }
									{ ! templateLock.has( 'insert' ) && (
										<>
											<MenuItem
												className="editor-block-settings-menu__control block-editor-block-settings-menu__control"
												onClick={ flow( onClose, onInsertBefore ) }
												icon="insert-before"
												shortcut={ shortcuts.insertBefore.display }
											>
												{ __( 'Insert Before' ) }
											</MenuItem>
											<MenuItem
												className="editor-block-settings-menu__control block-editor-block-settings-menu__control"
												onClick={ flow( onClose, onInsertAfter ) }
												icon="insert-after"
												shortcut={ shortcuts.insertAfter.display }
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
									{ ! templateLock.has( 'remove' ) && (
										<MenuItem
											className="editor-block-settings-menu__control block-editor-block-settings-menu__control"
											onClick={ flow( onClose, onRemove ) }
											icon="trash"
											shortcut={ shortcuts.removeBlock.display }
										>
											{ __( 'Remove Block' ) }
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
