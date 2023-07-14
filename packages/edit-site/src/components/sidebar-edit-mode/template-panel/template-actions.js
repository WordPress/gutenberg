/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { moreVertical } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';
import isTemplateRevertable from '../../../utils/is-template-revertable';

export default function Actions( { template } ) {
	const { revertTemplate } = useDispatch( editSiteStore );
	const isRevertable = isTemplateRevertable( template );
	if ( ! isRevertable ) {
		return null;
	}
	return (
		<DropdownMenu
			icon={ moreVertical }
			label={ __( 'Actions' ) }
			className="edit-site-template-card__actions"
			toggleProps={ { isSmall: true } }
		>
			{ ( { onClose } ) => (
				<MenuGroup>
					<MenuItem
						info={ __(
							'Use the template as supplied by the theme.'
						) }
						onClick={ () => {
							revertTemplate( template );
							onClose();
						} }
					>
						{ __( 'Clear customizations' ) }
					</MenuItem>
				</MenuGroup>
			) }
		</DropdownMenu>
	);
}
