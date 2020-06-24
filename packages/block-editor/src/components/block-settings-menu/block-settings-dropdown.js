/**
 * External dependencies
 */
import { castArray, flow, noop } from 'lodash';

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

import { Children, cloneElement, useCallback } from '@wordpress/element';
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

export function BlockSettingsDropdown( {
	clientIds,
	__experimentalSelectBlock,
	children,
	...props
} ) {
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

	const updateSelection = useCallback(
		__experimentalSelectBlock
			? async ( clientIdsPromise ) => {
					const ids = await clientIdsPromise;
					if ( ids && ids[ 0 ] ) {
						__experimentalSelectBlock( ids[ 0 ] );
					}
			  }
			: noop,
		[ __experimentalSelectBlock ]
	);

	return (
		<BlockActions
			clientIds={ clientIds }
			__experimentalUpdateSelection={ ! __experimentalSelectBlock }
		>
			{ ( {
				canDuplicate,
				canInsertDefaultBlock,
				isLocked,
				onDuplicate,
				onInsertAfter,
				onInsertBefore,
				onRemove,
				onCopy,
				onMoveTo,
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
								>
									{ __( 'Copy' ) }
								</ClipboardButton>
								{ canDuplicate && (
									<MenuItem
										onClick={ flow(
											onClose,
											onDuplicate,
											updateSelection
										) }
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
								{ ! isLocked && (
									<MenuItem
										onClick={ flow( onClose, onMoveTo ) }
									>
										{ __( 'Move To' ) }
									</MenuItem>
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
							{ typeof children === 'function'
								? children( { onClose } )
								: Children.map( ( child ) =>
										cloneElement( child, { onClose } )
								  ) }
							<MenuGroup>
								{ ! isLocked && (
									<MenuItem
										onClick={ flow(
											onClose,
											onRemove,
											updateSelection
										) }
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
