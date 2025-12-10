/**
 * WordPress dependencies
 */
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { moreVertical, check } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useInspectorPopoverPlacement } from './use-inspector-popover-placement';

export default function FieldsDropdownMenu( {
	fields,
	visibleFields,
	onToggleField,
} ) {
	const { popoverProps } = useInspectorPopoverPlacement();

	if ( ! fields || fields.length === 0 ) {
		return null;
	}

	return (
		<DropdownMenu
			icon={ moreVertical }
			label={ __( 'Options' ) }
			popoverProps={ popoverProps }
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
