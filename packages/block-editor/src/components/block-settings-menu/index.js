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
		const { getShortcutRepresentation } = select( 'core/keyboard-shortcuts' );
		return {
			duplicate: getShortcutRepresentation( 'core/block-editor/duplicate' ),
			remove: getShortcutRepresentation( 'core/block-editor/remove' ),
			insertAfter: getShortcutRepresentation( 'core/block-editor/insert-after' ),
			insertBefore: getShortcutRepresentation( 'core/block-editor/insert-before' ),
		};
	}, [] );

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
											onClick={ flow( onClose, onDuplicate ) }
											icon="admin-page"
											shortcut={ shortcuts.duplicate }
										>
											{ __( 'Duplicate' ) }
										</MenuItem>
									) }
									{ canInsertDefaultBlock && (
										<>
											<MenuItem
												onClick={ flow( onClose, onInsertBefore ) }
												icon="insert-before"
												shortcut={ shortcuts.insertBefore }
											>
												{ __( 'Insert Before' ) }
											</MenuItem>
											<MenuItem
												onClick={ flow( onClose, onInsertAfter ) }
												icon="insert-after"
												shortcut={ shortcuts.insertAfter }
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
											onClick={ flow( onClose, onRemove ) }
											icon="trash"
											shortcut={ shortcuts.remove }
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
