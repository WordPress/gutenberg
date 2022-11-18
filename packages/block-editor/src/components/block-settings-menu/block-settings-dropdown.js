/**
 * WordPress dependencies
 */
import { getBlockType, store as blocksStore } from '@wordpress/blocks';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { moreVertical } from '@wordpress/icons';
import {
	Children,
	cloneElement,
	createContext,
	useContext,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { pipe } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { useBlockActions } from '../block-actions';
import __unstableBlockSettingsMenuFirstItem from './block-settings-menu-first-item';
import BlockSettingsMenuControls from '../block-settings-menu-controls';
import { store as blockEditorStore } from '../../store';
import { CopyMenuItem } from './copy-menu-item';
import { DuplicateMenuItem } from './duplicate-menu-item';
import { RemoveMenuItem } from './remove-menu-item';
import { SelectParentMenuItem } from './select-parent-menu-item';
import { InsertBeforeMenuItem } from './insert-before-menu-item';
import { MoveMenuItem } from './move-menu-item';
import { HTMLConvertMenuItem } from './html-convert-menu-item';
import { BlockModeMenuItem } from './block-mode-menu-item';

export const noop = () => {};
const POPOVER_PROPS = {
	className: 'block-editor-block-settings-menu__popover',
	position: 'bottom right',
	variant: 'toolbar',
};

export const BlockSettingsDropdownContext = createContext();
BlockSettingsDropdownContext.displayName = 'BlockSettingsDropdownContext';

export function useBlockSettingsContext() {
	const context = useContext( BlockSettingsDropdownContext );
	if ( ! context ) {
		throw new Error(
			`BlockSettingsDropdown compound components cannot be rendered outside the BlockSettingsDropdown component`
		);
	}
	return context;
}

function InsertAfterMenuItem( { onClose } ) {
	const { shortcuts, onInsertAfter, canInsertDefaultBlock } = useContext(
		BlockSettingsDropdownContext
	);

	if ( ! canInsertDefaultBlock ) {
		return null;
	}

	return (
		<MenuItem
			onClick={ pipe( onClose, onInsertAfter ) }
			shortcut={ shortcuts.insertAfter }
		>
			{ __( 'Insert after' ) }
		</MenuItem>
	);
}

export function BlockSettingsDropdown( {
	clientIds,
	__experimentalSelectBlock,
	children,
	__unstableDisplayLocation,
	...props
} ) {
	const blockClientIds = Array.isArray( clientIds )
		? clientIds
		: [ clientIds ];

	const firstBlockClientId = blockClientIds[ 0 ];
	const { previousBlockClientId, nextBlockClientId, selectedBlockClientIds } =
		useSelect(
			( select ) => {
				const {
					getBlockName,
					getBlockRootClientId,
					getPreviousBlockClientId,
					getNextBlockClientId,
					getSelectedBlockClientIds,
					getBlockAttributes,
				} = select( blockEditorStore );

				const { getActiveBlockVariation } = select( blocksStore );

				const _firstParentClientId =
					getBlockRootClientId( firstBlockClientId );
				const parentBlockName =
					_firstParentClientId &&
					getBlockName( _firstParentClientId );

				return {
					parentBlockType:
						_firstParentClientId &&
						( getActiveBlockVariation(
							parentBlockName,
							getBlockAttributes( _firstParentClientId )
						) ||
							getBlockType( parentBlockName ) ),
					previousBlockClientId:
						getPreviousBlockClientId( firstBlockClientId ),
					nextBlockClientId:
						getNextBlockClientId( firstBlockClientId ),
					selectedBlockClientIds: getSelectedBlockClientIds(),
				};
			},
			[ firstBlockClientId ]
		);

	const shortcuts = useSelect( ( select ) => {
		const { getShortcutRepresentation } = select( keyboardShortcutsStore );
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

	const {
		canDuplicate,
		canInsertDefaultBlock,
		canMove,
		canRemove,
		onDuplicate,
		onInsertAfter,
		onInsertBefore,
		onRemove,
		onCopy,
		onMoveTo,
		blocks,
	} = useBlockActions( {
		clientIds: blockClientIds,
		__experimentalUpdateSelection: ! __experimentalSelectBlock,
	} );

	// Todo: memoize this
	const blockSettingsActionsContextValue = {
		__experimentalSelectBlock, // todo: should this be renamed to something more logically boolean?
		shortcuts, // can we omit from context and access directly from shortcuts store?
		blockClientIds,
		selectedBlockClientIds,
		previousBlockClientId,
		nextBlockClientId,
		blocks,
		canDuplicate,
		onDuplicate,
		onCopy,
		onMoveTo,
		canMove,
		canInsertDefaultBlock,
		onInsertBefore,
		onInsertAfter,
		canRemove,
		onRemove,
	};

	return (
		<BlockSettingsDropdownContext.Provider
			value={ blockSettingsActionsContextValue }
		>
			<DropdownMenu
				icon={ moreVertical }
				label={ __( 'Options' ) }
				className="block-editor-block-settings-menu"
				popoverProps={ POPOVER_PROPS }
				noIcons
				{ ...props }
			>
				{ ( { onClose } ) => {
					// Todo: how to make onClose part of the context?

					if ( children ) {
						return Children.map( children, ( child ) =>
							cloneElement( child, { onClose } )
						);
					}

					return (
						<>
							<MenuGroup>
								<__unstableBlockSettingsMenuFirstItem.Slot
									fillProps={ { onClose } }
								/>

								<SelectParentMenuItem />

								<HTMLConvertMenuItem />

								<CopyMenuItem />

								<DuplicateMenuItem onClose={ onClose } />

								<InsertBeforeMenuItem onClose={ onClose } />

								<InsertAfterMenuItem onClose={ onClose } />

								<MoveMenuItem onClose={ onClose } />

								<BlockModeMenuItem onClose={ onClose } />
							</MenuGroup>
							<BlockSettingsMenuControls.Slot
								fillProps={ { onClose } }
								clientIds={ clientIds }
								__unstableDisplayLocation={
									__unstableDisplayLocation
								}
							/>
							{ typeof children === 'function'
								? children( { onClose } )
								: Children.map( ( child ) =>
										cloneElement( child, { onClose } )
								  ) }

							<RemoveMenuItem onClose={ onClose } />
						</>
					);
				} }
			</DropdownMenu>
		</BlockSettingsDropdownContext.Provider>
	);
}

export default BlockSettingsDropdown;
