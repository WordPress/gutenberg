/**
 * WordPress dependencies
 */
import { check, minus, moreVertical } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import DropdownMenu from '../../dropdown-menu';
import MenuGroup from '../../menu-group';
import MenuItem from '../../menu-item';
import { useToolsPanelHeader } from './hook';
import { contextConnect } from '../../ui/context';

const getAriaLabel = ( label, isSelected ) => {
	return isSelected
		? sprintf(
				// translators: %s: The name of the control being hidden and reset e.g. "Padding".
				__( 'Hide and reset %s' ),
				label
		  )
		: sprintf(
				// translators: %s: The name of the control to display e.g. "Padding".
				__( 'Show %s' ),
				label
		  );
};

const ToolsPanelHeader = ( props, forwardedRef ) => {
	const {
		hasMenuItems,
		label: labelText,
		menuItems,
		resetAll,
		toggleItem,
		...headerProps
	} = useToolsPanelHeader( props );

	if ( ! labelText ) {
		return null;
	}

	const defaultItems = Object.entries( menuItems?.default || {} );
	const optionalItems = Object.entries( menuItems?.optional || {} );

	return (
		<h2 { ...headerProps } ref={ forwardedRef }>
			{ labelText }
			{ hasMenuItems && (
				<DropdownMenu
					icon={ moreVertical }
					label={ labelText }
					menuProps={ { style: { minWidth: '200px' } } }
				>
					{ ( { onClose } ) => (
						<>
							{ !! defaultItems?.length && (
								<MenuGroup>
									{ defaultItems.map(
										( [ label, hasValue ] ) => {
											const icon = hasValue
												? minus
												: check;

											const itemLabel = hasValue
												? sprintf(
														// translators: %s: The name of the control being reset e.g. "Padding".
														__( 'Reset %s' ),
														label
												  )
												: undefined;

											return (
												<MenuItem
													key={ label }
													icon={ icon }
													isSelected={ true }
													disabled={ ! hasValue }
													label={ itemLabel }
													onClick={ () => {
														toggleItem( label );
														onClose();
													} }
													role="menuitemcheckbox"
												>
													{ label }
												</MenuItem>
											);
										}
									) }
								</MenuGroup>
							) }
							{ !! optionalItems?.length && (
								<MenuGroup>
									{ optionalItems.map(
										( [ label, isSelected ] ) => {
											const itemLabel = getAriaLabel(
												label,
												isSelected
											);

											return (
												<MenuItem
													key={ label }
													icon={ isSelected && check }
													isSelected={ isSelected }
													label={ itemLabel }
													onClick={ () => {
														toggleItem( label );
														onClose();
													} }
													role="menuitemcheckbox"
												>
													{ label }
												</MenuItem>
											);
										}
									) }
								</MenuGroup>
							) }
							<MenuGroup>
								<MenuItem
									variant={ 'tertiary' }
									onClick={ () => {
										resetAll();
										onClose();
									} }
								>
									{ __( 'Reset all' ) }
								</MenuItem>
							</MenuGroup>
						</>
					) }
				</DropdownMenu>
			) }
		</h2>
	);
};

const ConnectedToolsPanelHeader = contextConnect(
	ToolsPanelHeader,
	'ToolsPanelHeader'
);

export default ConnectedToolsPanelHeader;
