import { Fill, Slot } from '@wordpress/components';
import { Children, Fragment, isValidElement } from '@wordpress/element';
import type { ComponentType, ReactElement, ReactNode } from 'react';
import type { IconType } from '@wordpress/components';
import {
	useBlockEditContext,
	mayDisplayControlsKey,
} from '../../block-edit/context';

const SLOT_NAME = 'BlockToolbarOptionsMenuItems';

/**
 * Where an item goes in the redesigned block toolbar.
 *
 * - `align`: in the Align group of the options menu.
 * - `layout`: in the Layout menu of container blocks.
 * - `actions`: next to Group and Create pattern in the options menu.
 * - `insert`: in the Insert submenu of the options menu.
 * - `more`: in the More submenu of the options menu.
 */
export type BlockOptionsMenuItemGroup =
	'align' | 'layout' | 'actions' | 'insert' | 'more';

/**
 * One of the values an item lets the user choose from.
 */
export interface BlockOptionsMenuChoice {
	/**
	 * The value.
	 */
	value: string;
	/**
	 * The visible label.
	 */
	label: string;
	/**
	 * An optional icon shown before the label.
	 */
	icon?: IconType;
	/**
	 * Optional supporting information shown after the label, such as a size.
	 */
	info?: string;
}

export interface BlockOptionsMenuItemProps {
	/**
	 * Where the item goes.
	 */
	group: BlockOptionsMenuItemGroup;
	/**
	 * A unique name for the item.
	 */
	name: string;
	/**
	 * The visible label of the item. Keep it short; it is also what the menu
	 * search matches. For an item with choices in the Layout menu, it labels
	 * the group of choices.
	 */
	label: string;
	/**
	 * An optional icon shown before the label.
	 */
	icon?: IconType;
	/**
	 * An optional keyboard shortcut, as displayed.
	 */
	shortcut?: string | null;
	/**
	 * Whether the item is disabled.
	 */
	disabled?: boolean;
	/**
	 * Called when the item is chosen. The menu closes first.
	 */
	onClick?: () => void;
	/**
	 * Values to choose from. The options menu shows them in a submenu, with
	 * the chosen one next to the label; the Layout menu shows them in a group.
	 */
	choices?: BlockOptionsMenuChoice[];
	/**
	 * The chosen value, if any.
	 */
	value?: string;
	/**
	 * Called with the value the user chooses.
	 */
	onChange?: ( value: string ) => void;
}

/**
 * The props the slot passes to function fills.
 */
export interface BlockOptionsMenuItemFillProps {
	/**
	 * The client IDs of the blocks the menu acts on.
	 */
	clientIds: string[];
}

/**
 * Describes an item of the redesigned block toolbar menus. It renders nothing
 * itself: the menus read its props and render the item, so they can also find
 * it when searching. Render it directly as the child of a fill, not inside
 * another component.
 *
 * Any UI the item opens, such as a modal, must be rendered outside the fill,
 * because the menu unmounts its items when it closes.
 */
export const BlockOptionsMenuItem: ComponentType<
	BlockOptionsMenuItemProps
> = () => null;

type FillChildren =
	ReactNode | ( ( fillProps: BlockOptionsMenuItemFillProps ) => ReactNode );

/**
 * Adds items to the menus of the redesigned block toolbar, for the selected
 * blocks.
 *
 * @param props          Component props.
 * @param props.children `BlockOptionsMenuItem` elements, or a function of the
 *                       fill props returning them.
 */
export function BlockOptionsMenuItemFill( {
	children,
}: {
	children: FillChildren;
} ) {
	return (
		<Fill name={ SLOT_NAME }>
			{
				// The slot passes the fill props the function is typed with.
				children as ReactNode
			}
		</Fill>
	);
}

/**
 * Adds items to the menus of the redesigned block toolbar from a block's edit
 * component or a block support. Like `BlockControls`, it only adds them while
 * the block shows its controls.
 *
 * @param props          Component props.
 * @param props.children `BlockOptionsMenuItem` elements.
 */
export function BlockOptionsMenuControls( {
	children,
}: {
	children: FillChildren;
} ) {
	const context = useBlockEditContext();
	if ( ! context[ mayDisplayControlsKey ] ) {
		return null;
	}
	return <BlockOptionsMenuItemFill>{ children }</BlockOptionsMenuItemFill>;
}

/**
 * Finds the menu item elements in rendered fills, looking into fragments.
 *
 * @param node The rendered fills.
 * @return The props of the menu items.
 */
function getMenuItems( node: ReactNode ): BlockOptionsMenuItemProps[] {
	return Children.toArray( node ).flatMap( ( child ) => {
		if ( ! isValidElement( child ) ) {
			return [];
		}
		if ( child.type === Fragment ) {
			return getMenuItems(
				( child as ReactElement< { children?: ReactNode } > ).props
					.children
			);
		}
		if ( child.type === BlockOptionsMenuItem ) {
			return [
				( child as ReactElement< BlockOptionsMenuItemProps > ).props,
			];
		}
		return [];
	} );
}

/**
 * Reads the items added to the menus of the redesigned block toolbar.
 *
 * Only one instance can read them at a time: render it once, around
 * everything that needs the items.
 *
 * @param props           Component props.
 * @param props.clientIds The client IDs of the blocks the menus act on.
 * @param props.children  Renders the menus from the items.
 */
export function BlockOptionsMenuItemsSlot( {
	clientIds,
	children,
}: {
	clientIds: string[];
	children: ( items: BlockOptionsMenuItemProps[] ) => ReactNode;
} ) {
	return (
		<Slot name={ SLOT_NAME } fillProps={ { clientIds } }>
			{ ( fills ) => children( getMenuItems( fills as ReactNode ) ) }
		</Slot>
	);
}
