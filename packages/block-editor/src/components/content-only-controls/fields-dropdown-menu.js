/**
 * WordPress dependencies
 */
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { moreVertical, check } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

export default function FieldsDropdownMenu( {
	fields,
	visibleFields,
	onToggleField,
} ) {
	if ( ! fields || fields.length === 0 ) {
		return null;
	}

	return (
		<DropdownMenu
			icon={ moreVertical }
			label={ __( 'Options' ) }
			popoverProps={ { placement: 'bottom-end' } }
		>
			{ ( { onClose } ) => (
				<MenuGroup label={ __( 'Show / Hide' ) }>
					{ fields.map( ( field ) => {
						const isVisible = visibleFields.includes( field.id );
						return (
							<MenuItem
								key={ field.id }
								isSelected={ isVisible }
								onClick={ () => {
									onToggleField( field.id );
									onClose();
								} }
								role="menuitemcheckbox"
								icon={ isVisible ? check : null }
							>
								{ field.label }
							</MenuItem>
						);
					} ) }
				</MenuGroup>
			) }
		</DropdownMenu>
	);
}
