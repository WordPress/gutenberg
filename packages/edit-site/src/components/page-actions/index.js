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
import RenamePostMenuItem from '../rename-post-menu-item';

export default function PageActions( {
	className,
	onRemove,
	page,
	toggleProps,
} ) {
	return (
		<DropdownMenu
			className={ className }
			icon={ moreVertical }
			label={ __( 'Actions' ) }
			toggleProps={ toggleProps }
		>
			{ () => (
				<MenuGroup>
					<RenamePostMenuItem post={ page } />
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
