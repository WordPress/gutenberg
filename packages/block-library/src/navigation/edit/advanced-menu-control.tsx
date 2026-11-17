import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { Stack, SwitchControl, Text } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
import { useConvertToNavigationLinks } from '../../page-list/use-detach-page-list';
import DetachPageListDialog from '../../page-list/detach-dialog';
import { useIsPagesOnlyMenu } from '../use-is-pages-only-menu';

/**
 * Turns the menu's `auto_add_pages` setting on and off.
 *
 * @param props        Component props.
 * @param props.menuId ID of the Navigation Menu.
 */
function AutoAddPagesControl( { menuId }: { menuId: number } ) {
	const [ meta, setMeta ] = useEntityProp(
		'postType',
		'wp_navigation',
		'meta',
		menuId
	) as [
		Record< string, unknown > | undefined,
		( meta: Record< string, unknown > ) => void,
		unknown,
	];
	return (
		<SwitchControl
			label={ __( 'Add new pages automatically' ) }
			description={ __(
				'Add pages to the end of this menu when they’re published. Child pages are added under their parent page.'
			) }
			checked={ !! meta?.auto_add_pages }
			onCheckedChange={ ( checked: boolean ) =>
				setMeta( { ...meta, auto_add_pages: checked } )
			}
		/>
	);
}

/**
 * In a pages menu, a Navigation block whose only item is a Page List, says
 * that the menu lists pages, and offers to switch it to an advanced menu, of
 * links, to add other items. The pages become links, and new pages are still
 * added to the menu. In any other saved menu, turns adding new pages
 * automatically on and off.
 *
 * @param props          Component props.
 * @param props.clientId Client ID of the Navigation block.
 */
export default function AdvancedMenuControl( {
	clientId,
}: {
	clientId: string;
} ) {
	const isPagesOnly = useIsPagesOnlyMenu( clientId );
	const { pageListClientId, menuId, hasPageList } = useSelect(
		( select ) => {
			const {
				getBlockOrder,
				getBlockAttributes,
				getBlockName,
				getClientIdsOfDescendants,
			} = select( blockEditorStore );
			return {
				pageListClientId: getBlockOrder( clientId )[ 0 ],
				hasPageList: getClientIdsOfDescendants( clientId ).some(
					( id: string ) => getBlockName( id ) === 'core/page-list'
				),
				menuId: getBlockAttributes( clientId )?.ref as
					number | undefined,
			};
		},
		[ clientId ]
	);
	const [ isConfirming, setIsConfirming ] = useState( false );
	const convertToNavigationLinks = useConvertToNavigationLinks( {
		clientId: pageListClientId,
		parentClientId: clientId,
	} );

	if ( ! isPagesOnly ) {
		// A Page List adds new pages itself.
		return menuId && ! hasPageList ? (
			<div className="wp-block-navigation__advanced-menu-control">
				<AutoAddPagesControl menuId={ menuId } />
			</div>
		) : null;
	}

	return (
		<Stack
			direction="column"
			gap="sm"
			className="wp-block-navigation__advanced-menu-control"
		>
			<Text variant="body-sm">
				{ __(
					'This menu lists your pages. To add links, posts and other items, switch to an advanced menu.'
				) }
			</Text>
			<Button
				__next40pxDefaultSize
				variant="secondary"
				onClick={ () => setIsConfirming( true ) }
			>
				{ __( 'Switch to advanced menu' ) }
			</Button>
			{ isConfirming && (
				<DetachPageListDialog
					title={ __( 'Switch to advanced menu' ) }
					confirmButtonText={ __( 'Switch' ) }
					message={ __(
						'An advanced menu can hold links, posts and other items as well as pages. Its pages will become links that you can edit, rename and remove. New pages will still be added to it automatically.'
					) }
					onConfirm={ () => {
						convertToNavigationLinks();
						setIsConfirming( false );
					} }
					onCancel={ () => setIsConfirming( false ) }
				/>
			) }
		</Stack>
	);
}
