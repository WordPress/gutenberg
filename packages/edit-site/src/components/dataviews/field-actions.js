/**
 * WordPress dependencies
 */
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { moreVertical } from '@wordpress/icons';

function FieldActions( { item, actions } ) {
	return (
		<DropdownMenu icon={ moreVertical } label={ __( 'Actions' ) }>
			{ () => (
				<MenuGroup>
					{ actions.map( ( action ) => (
						<MenuItem
							key={ action.id }
							onClick={ () => action.perform( item ) }
							isDestructive={ action.isDesctructive }
						>
							{ action.label }
						</MenuItem>
					) ) }
				</MenuGroup>
			) }
		</DropdownMenu>
	);
}

export default FieldActions;
