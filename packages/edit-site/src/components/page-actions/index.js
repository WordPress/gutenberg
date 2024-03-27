/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { DropdownMenu, MenuGroup } from '@wordpress/components';
import { moreVertical } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import TrashPageMenuItem from './trash-page-menu-item';
import RenameMenuItem from '../rename-menu-item';

export default function PageActions( { onRemove, page, toggleProps } ) {
	return (
		<DropdownMenu
			icon={ moreVertical }
			label={ __( 'Actions' ) }
			toggleProps={ toggleProps }
		>
			{ ( { onClose } ) => (
				<MenuGroup>
					<RenameMenuItem item={ page } onClose={ onClose } />
					{ !! onRemove && (
						<TrashPageMenuItem
							page={ page }
							onRemove={ onRemove }
						/>
					) }
				</MenuGroup>
			) }
		</DropdownMenu>
	);
}
