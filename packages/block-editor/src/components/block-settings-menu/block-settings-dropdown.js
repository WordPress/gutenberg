/**
 * External dependencies
 */
import { castArray, flow } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, _n } from '@wordpress/i18n';
import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	ClipboardButton,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { moreHorizontal } from '@wordpress/icons';
import { serialize } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import BlockActions from '../block-actions';
import BlockModeToggle from './block-mode-toggle';
import BlockHTMLConvertButton from './block-html-convert-button';
import BlockUnknownConvertButton from './block-unknown-convert-button';
import __experimentalBlockSettingsMenuFirstItem from './block-settings-menu-first-item';
import BlockSettingsMenuControls from '../block-settings-menu-controls';

const POPOVER_PROPS = {
	className: 'block-editor-block-settings-menu__popover',
	position: 'bottom right',
	isAlternate: true,
};

export function BlockSettingsDropdown( { clientIds, ...props } ) {
	const blockClientIds = castArray( clientIds );
	const count = blockClientIds.length;
	const firstBlockClientId = blockClientIds[ 0 ];

	const shortcuts = useSelect( ( select ) => {
		const { getShortcutRepresentation } = select(
			'core/keyboard-shortcuts'
		);
		return {
			duplicate: getShortcutRepresentation(
				'core/block-editor/duplicate'
			),
			remove: getShortcutRepresentation( 'core/block-editor/remove' ),
			insertAfter: getShortcutRepresentation(
				'core/block-editor/insert-after'
			),
			insertBefore: getShortcutRepresentation(
				'core/block-editor/insert-before'
			),
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
				onCopy,
				blocks,
			} ) => (
				<DropdownMenu
					icon={ moreHorizontal }
					label={ __( 'More options' ) }
					className="block-editor-block-settings-menu"
					popoverProps={ POPOVER_PROPS }
					noIcons
					{ ...props }
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
								<ClipboardButton
									text={ () => serialize( blocks ) }
									role="menuitem"
									className="components-menu-item__button"
									onCopy={ onCopy }
									onFinishCopy={ onClose }
								>
									{ __( 'Copy' ) }
								</ClipboardButton>
								{ canDuplicate && (
									<MenuItem
										onClick={ flow( onClose, onDuplicate ) }
										shortcut={ shortcuts.duplicate }
									>
										{ __( 'Duplicate' ) }
									</MenuItem>
								) }
								{ canInsertDefaultBlock && (
									<>
										<MenuItem
											onClick={ flow(
												onClose,
												onInsertBefore
											) }
											shortcut={ shortcuts.insertBefore }
										>
											{ __( 'Insert Before' ) }
										</MenuItem>
										<MenuItem
											onClick={ flow(
												onClose,
												onInsertAfter
											) }
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
							</MenuGroup>
							<BlockSettingsMenuControls.Slot
								fillProps={ { onClose } }
								clientIds={ clientIds }
							/>
							<MenuGroup>
								{ ! isLocked && (
									<MenuItem
										onClick={ flow( onClose, onRemove ) }
										shortcut={ shortcuts.remove }
									>
										{ _n(
											'Remove Block',
											'Remove Blocks',
											count
										) }
									</MenuItem>
								) }
							</MenuGroup>
						</>
					) }
				</DropdownMenu>
			) }
		</BlockActions>
	);
}

export default BlockSettingsDropdown;
