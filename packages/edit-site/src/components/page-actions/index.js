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

export default function PageActions( {
	postId,
	className,
	toggleProps,
	onRemove,
} ) {
	return (
		<DropdownMenu
			icon={ moreVertical }
			label={ __( 'Actions' ) }
			className={ className }
			toggleProps={ toggleProps }
		>
			{ () => (
				<MenuGroup>
					<TrashPageMenuItem
						postId={ postId }
						onRemove={ onRemove }
					/>
				</MenuGroup>
			) }
		</DropdownMenu>
	);
}
