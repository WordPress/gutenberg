/**
 * WordPress dependencies
 */
import { check, moreVertical } from '@wordpress/icons';
import { SVG } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import DropdownMenu from '../../dropdown-menu';
import MenuGroup from '../../menu-group';
import MenuItem from '../../menu-item';
import { useToolsPanelHeader } from './hook';
import { contextConnect } from '../../ui/context';

const emptyIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"></SVG>
);

const ToolsPanelHeader = ( props, forwardedRef ) => {
	const {
		hasMenuItems,
		header,
		menuItems,
		menuLabel,
		resetAll,
		toggleItem,
		...headerProps
	} = useToolsPanelHeader( props );

	if ( ! header ) {
		return null;
	}

	return (
		<h2 { ...headerProps } ref={ forwardedRef }>
			{ header }
			{ hasMenuItems && (
				<DropdownMenu icon={ moreVertical } label={ menuLabel }>
					{ ( { onClose } ) => (
						<>
							<MenuGroup label={ __( 'Display options' ) }>
								{ Object.entries( menuItems ).map(
									( [ label, isSelected ] ) => {
										return (
											<MenuItem
												key={ label }
												icon={
													isSelected
														? check
														: emptyIcon
												}
												isSelected={ isSelected }
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
							<MenuGroup>
								<MenuItem
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
