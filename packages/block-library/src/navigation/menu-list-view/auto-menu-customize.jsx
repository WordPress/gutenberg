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
 * @param {?string} navigationClientId Client id of the Navigation block.
 * @return {{canCustomize: boolean, isBusy: boolean, customize: () => void}} Customize state and action.
 */
export function useCustomizeAutoMenu( navigationClientId ) {
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
		canCustomize: !! pageList && hasResolved && pages?.length > 0,
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
 * @param {Object}     props           Component props.
 * @param {boolean}    props.isBusy    Whether the pages are still loading.
 * @param {() => void} props.onConfirm Called when confirmed.
 * @param {() => void} props.onCancel  Called when cancelled.
 */
export function AutoMenuCustomizeDialog( { isBusy, onConfirm, onCancel } ) {
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
					'Your menu shows your published pages and adds new ones automatically.'
				) }
			</p>
			<p>
				{ __(
					'If you customize it, its pages become links you can add to, remove, and reorder. New pages won’t be added to it automatically anymore.'
				) }
			</p>
		</ConfirmDialog>
	);
}
