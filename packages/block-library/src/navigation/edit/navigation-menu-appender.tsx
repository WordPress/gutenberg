import type { Dispatch, FocusEventHandler, ForwardedRef } from 'react';
import { createBlock } from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	Popover as WCPopover,
} from '@wordpress/components';
import { useMergeRefs } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addSubmenu, customLink, page, plus } from '@wordpress/icons';
import { DEFAULT_BLOCK } from '../constants';
import { unlock } from '../../lock-unlock';

const { PrivateQuickInserter: QuickInserter } = unlock(
	blockEditorPrivateApis
);

const POPOVER_PROPS = { placement: 'bottom-start' } as const;

interface NavigationMenuAppenderProps {
	/** Client ID of the block that new menu items are appended to. */
	rootClientId?: string | null;
	/** Marks the new menu item as just inserted, so its link UI opens. */
	setInsertedBlockClientId: Dispatch< string | null >;
	/** Props for the toggle, so it takes part in the List View's keyboard navigation. */
	toggleProps?: {
		ref?: ForwardedRef< HTMLElement >;
		className?: string;
		tabIndex?: number;
		onFocus?: FocusEventHandler;
		'aria-describedby'?: string;
	};
}

// Each task inserts an existing block, so the saved markup does not change.
// A function, so the labels are translated after the translations load.
const getTasks = () => [
	{
		key: 'page',
		label: __( 'Add page' ),
		icon: page,
		blockName: DEFAULT_BLOCK.name,
		create: () =>
			createBlock( DEFAULT_BLOCK.name, DEFAULT_BLOCK.attributes ),
	},
	{
		key: 'custom-link',
		label: __( 'Custom link' ),
		icon: customLink,
		blockName: 'core/navigation-link',
		create: () => createBlock( 'core/navigation-link' ),
	},
	{
		key: 'submenu',
		label: __( 'Submenu' ),
		icon: addSubmenu,
		blockName: 'core/navigation-submenu',
		create: () => createBlock( 'core/navigation-submenu' ),
	},
];

/**
 * Replaces the List View's "Add page" button in Navigation Menu editing
 * surfaces with a menu of tasks: add a page, a custom link or a submenu, or
 * pick any other allowed block from "More…".
 *
 * @param props                          Component props.
 * @param props.rootClientId             Client ID of the block that new menu items are appended to.
 * @param props.setInsertedBlockClientId Marks the new menu item as just inserted, so its link UI opens.
 * @param props.toggleProps              Props for the toggle, from the List View.
 */
export function NavigationMenuAppender( {
	rootClientId,
	setInsertedBlockClientId,
	toggleProps = {},
}: NavigationMenuAppenderProps ) {
	const { ref, ...restToggleProps } = toggleProps;
	const [ toggleElement, setToggleElement ] = useState< HTMLElement | null >(
		null
	);
	const [ isMoreOpen, setIsMoreOpen ] = useState( false );
	const toggleRef = useMergeRefs( [ ref, setToggleElement ] );

	const { insertBlock } = useDispatch( blockEditorStore );
	const { canInsertLink, canInsertSubmenu } = useSelect(
		( select ) => {
			const { canInsertBlockType } = select( blockEditorStore );
			return {
				canInsertLink: canInsertBlockType(
					'core/navigation-link',
					rootClientId
				),
				canInsertSubmenu: canInsertBlockType(
					'core/navigation-submenu',
					rootClientId
				),
			};
		},
		[ rootClientId ]
	);
	const allowedTasks = getTasks().filter( ( { blockName } ) =>
		blockName === 'core/navigation-submenu'
			? canInsertSubmenu
			: canInsertLink
	);

	// `DropdownMenu` forwards a `ref` in `toggleProps` to the toggle, but its
	// type doesn't declare one. The List View needs it for keyboard navigation.
	const dropdownToggleProps = {
		...restToggleProps,
		ref: toggleRef,
		__next40pxDefaultSize: true,
	};

	const appendBlock = ( block: Block ) => {
		// Don't select the new block: selecting it moves focus to the canvas
		// and closes the link UI that opens for it in the List View.
		const updateSelection = false;
		insertBlock(
			block,
			undefined,
			rootClientId ?? undefined,
			updateSelection
		);
		setInsertedBlockClientId( block.clientId );
	};

	return (
		<>
			<DropdownMenu
				icon={ plus }
				label={ __( 'Add menu item' ) }
				popoverProps={ POPOVER_PROPS }
				toggleProps={ dropdownToggleProps }
				// Arrow keys move between rows in the List View tree grid.
				disableOpenOnArrowDown
			>
				{ ( { onClose } ) => (
					<>
						{ allowedTasks.length > 0 && (
							<MenuGroup>
								{ allowedTasks.map( ( task ) => (
									<MenuItem
										key={ task.key }
										icon={ task.icon }
										iconPosition="left"
										onClick={ () => {
											appendBlock( task.create() );
											onClose();
										} }
									>
										{ task.label }
									</MenuItem>
								) ) }
							</MenuGroup>
						) }
						<MenuGroup>
							<MenuItem
								onClick={ () => {
									onClose();
									setIsMoreOpen( true );
								} }
							>
								{ __( 'More…' ) }
							</MenuItem>
						</MenuGroup>
					</>
				) }
			</DropdownMenu>
			{ isMoreOpen && (
				<WCPopover
					anchor={ toggleElement }
					placement="bottom-start"
					className="block-editor-inserter__popover is-quick"
					focusOnMount="firstElement"
					onClose={ () => {
						setIsMoreOpen( false );
						toggleElement?.focus();
					} }
				>
					<QuickInserter
						rootClientId={ rootClientId }
						isAppender
						selectBlockOnInsert={ false }
						onSelect={ ( blocks: Block | Block[] ) => {
							const block = Array.isArray( blocks )
								? blocks[ 0 ]
								: blocks;
							setIsMoreOpen( false );
							if ( block?.clientId ) {
								setInsertedBlockClientId( block.clientId );
							} else {
								toggleElement?.focus();
							}
						} }
					/>
				</WCPopover>
			) }
		</>
	);
}
