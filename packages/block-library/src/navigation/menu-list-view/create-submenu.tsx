import { createBlock, cloneBlock } from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { MenuGroup, MenuItem } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { addSubmenu } from '@wordpress/icons';
import isNavigationMenuEditingEnabled from './is-enabled';
import { setSubmenuRequest } from './submenu-request';
import type { SubmenuRequest } from './submenu-request';
import type { SubmenuType } from './submenu-type-menu-group';
import {
	createCustomLinkSubmenuBlock,
	createPageSubmenuBlock,
} from './appender-blocks';

/**
 * Run `callback` with the element once the list view has rendered it.
 *
 * @param getElement Finds the element.
 * @param callback   Called with it.
 * @param onGiveUp   Called if it never shows.
 */
export function whenRendered< T extends Element = HTMLElement >(
	getElement: () => T | null | undefined,
	callback: ( element: T ) => void,
	onGiveUp?: () => void
) {
	let attempts = 0;
	const check = () => {
		const element = getElement();
		if ( element ) {
			callback( element );
		} else if ( ++attempts < 20 ) {
			window.requestAnimationFrame( check );
		} else {
			onGiveUp?.();
		}
	};
	window.requestAnimationFrame( check );
}

/**
 * Turns an item into the first item of a new submenu, in its place, choosing
 * the kind of submenu as when adding one with the add button (#86178).
 *
 * - Existing page or custom link: the new submenu's own link is chosen next,
 *   in the link popover.
 * - Label only: `label` is the submenu's label. Then, outside the Navigation
 *   block's inspector (where selecting moves away from the list), the new
 *   submenu is selected and its add button's menu opens, to add more items.
 *
 * @param options
 * @param options.clientId                 The item.
 * @param options.type                     'page', 'custom' or 'label-only'.
 * @param options.label                    Label-only submenu's label (escaped).
 * @param options.registry                 Data registry.
 * @param options.updateExpansion          List view expansion setter.
 * @param options.setInsertedBlockClientId Opens the link popover.
 */
export function convertToSubmenu( {
	clientId,
	type,
	label,
	registry,
	updateExpansion,
	setInsertedBlockClientId,
}: {
	clientId: string;
	type: SubmenuType;
	label?: string;
	// The registry's `select` and `dispatch` are untyped for this store.
	registry: any;
	updateExpansion?: SubmenuRequest[ 'updateExpansion' ];
	setInsertedBlockClientId: ( clientId: string ) => void;
} ) {
	const { getBlock } = registry.select( blockEditorStore );
	const { replaceBlock, selectBlock } = registry.dispatch( blockEditorStore );
	const row = document.querySelector(
		`.block-editor-list-view-leaf[data-block="${ clientId }"]`
	);
	const isInInspector = !! row?.closest( '.block-editor-block-inspector' );
	const innerBlocks = [ cloneBlock( getBlock( clientId ) ) ];

	let submenu: Block;
	if ( type === 'page' ) {
		submenu = createPageSubmenuBlock( innerBlocks );
	} else if ( type === 'custom' ) {
		submenu = createCustomLinkSubmenuBlock( innerBlocks );
	} else {
		submenu = createBlock(
			'core/navigation-submenu',
			{ label },
			innerBlocks
		);
	}

	replaceBlock( clientId, submenu );
	updateExpansion?.( { type: 'expand', clientIds: [ submenu.clientId ] } );

	if ( type !== 'label-only' ) {
		setInsertedBlockClientId( submenu.clientId );
		return;
	}
	if ( isInInspector ) {
		return;
	}
	selectBlock( submenu.clientId, null );
	whenRendered(
		() =>
			document.querySelector< HTMLElement >(
				`[data-navigation-menu-appender-for="${ submenu.clientId }"] .navigation-menu-appender__toggle`
			),
		( toggle: HTMLElement ) => {
			toggle.focus();
			toggle.click();
		}
	);
}

/**
 * "Create submenu" in a menu item's options menu (#86178). Opens the same
 * choice of submenu as the add button's "Submenu" option, beside the item,
 * and the item becomes the new submenu's first item.
 *
 * @param props
 * @param props.clientId        The item.
 * @param props.onClose         Closes the options menu.
 * @param props.updateExpansion List view expansion setter.
 * @return The menu group, for links only.
 */
export default function CreateSubmenuMenuGroup( {
	clientId,
	onClose,
	updateExpansion,
}: {
	clientId: string;
	onClose: () => void;
	updateExpansion?: SubmenuRequest[ 'updateExpansion' ];
} ) {
	const isLink = useSelect(
		( select ) =>
			select( blockEditorStore ).getBlockName( clientId ) ===
			'core/navigation-link',
		[ clientId ]
	);

	if ( ! isNavigationMenuEditingEnabled() || ! isLink ) {
		return null;
	}

	return (
		<MenuGroup>
			<MenuItem
				icon={ addSubmenu }
				aria-haspopup="menu"
				onClick={ () => {
					onClose();
					// The options menu is gone once closed, so the menu's
					// top-level add button shows the choice.
					setSubmenuRequest( {
						clientId,
						step: 'type',
						updateExpansion,
					} );
				} }
			>
				{ __( 'Create submenu' ) }
			</MenuItem>
		</MenuGroup>
	);
}
