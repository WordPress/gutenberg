import { __experimentalConfirmDialog as ConfirmDialog } from '@wordpress/components';
import { useDispatch, useRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { store as noticesStore } from '@wordpress/notices';
import { __ } from '@wordpress/i18n';
import { convertToNavigationLinks } from '../../page-list/use-convert-to-navigation-links';
import { useAutoMenuPageList, useAutoMenuPages } from './auto-menu-use-pages';

/**
 * Turns an Auto menu into a menu people manage themselves, reusing the Page
 * List's conversion: the pages it shows now become links and sub menus.
 *
 * @param navigationClientId Client id of the Navigation block.
 * @return Customize state and action.
 */
export function useCustomizeAutoMenu(
	navigationClientId: string | null | undefined
): { canCustomize: boolean; isBusy: boolean; customize: () => void } {
	const pageList = useAutoMenuPageList( navigationClientId );
	const { pages, hasResolved } = useAutoMenuPages(
		pageList?.attributes?.parentPageID
	);
	const registry = useRegistry();
	const { replaceBlock, replaceBlocks } = useDispatch( blockEditorStore );
	const { createSuccessNotice } = useDispatch( noticesStore );

	const customize = () => {
		if ( ! pageList || ! pages?.length ) {
			return;
		}
		const links = convertToNavigationLinks(
			pages,
			pageList.attributes?.parentPageID
		);
		const pageListAttributes = pageList.attributes;
		const linkClientIds = links.map( ( link ) => link.clientId );
		replaceBlock( pageList.clientId, links );

		createSuccessNotice(
			__( 'Menu customized. New pages won’t be added automatically.' ),
			{
				type: 'snackbar',
				id: 'navigation-auto-menu-customized',
				actions: [
					{
						label: __( 'Undo' ),
						onClick: () => {
							// Put the Auto menu back, if its links are still there.
							const { getBlock } =
								registry.select( blockEditorStore );
							const remaining = linkClientIds.filter(
								( clientId ) => !! getBlock( clientId )
							);
							if ( ! remaining.length ) {
								return;
							}
							replaceBlocks(
								remaining,
								createBlock(
									'core/page-list',
									pageListAttributes
								)
							);
						},
					},
				],
			}
		);
	};

	return {
		canCustomize: !! pageList && hasResolved && ( pages?.length ?? 0 ) > 0,
		isBusy: ! hasResolved,
		customize,
	};
}

/**
 * Confirms customizing an Auto menu, explaining what changes.
 *
 * Customizing can be undone (Undo snackbar, editor undo, or not saving), so
 * this follows the WPDS "Destructive actions" pattern for reversible changes:
 * a `ConfirmDialog` with a primary (not destructive) confirm button.
 *
 * @param props           Component props.
 * @param props.isBusy    Whether the pages are still loading.
 * @param props.onConfirm Called when confirmed.
 * @param props.onCancel  Called when cancelled.
 */
export function AutoMenuCustomizeDialog( {
	isBusy,
	onConfirm,
	onCancel,
}: {
	isBusy: boolean;
	onConfirm: () => void;
	onCancel: () => void;
} ) {
	return (
		<ConfirmDialog
			isOpen
			title={ __( 'Customize this menu?' ) }
			__experimentalHideHeader={ false }
			confirmButtonText={ __( 'Customize menu' ) }
			onConfirm={ onConfirm }
			onCancel={ onCancel }
			isBusy={ isBusy }
			size="medium"
		>
			<p>
				{ __(
					'You’ll be able to edit this menu, but new pages won’t be added to it automatically.'
				) }
			</p>
		</ConfirmDialog>
	);
}
