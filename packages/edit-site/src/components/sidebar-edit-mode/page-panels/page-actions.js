/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { DropdownMenu, MenuGroup } from '@wordpress/components';
import { moreVertical } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import RenameMenuItem from '../../rename-menu-item';

export default function Actions( { page } ) {
	return (
		<DropdownMenu
			icon={ moreVertical }
			label={ __( 'Actions' ) }
			className="edit-site-template-card__actions"
			toggleProps={ { isSmall: true } }
		>
			{ ( { onClose } ) => (
				<MenuGroup>
					<RenameMenuItem item={ page } onClose={ onClose } />
				</MenuGroup>
			) }
		</DropdownMenu>
	);
}
