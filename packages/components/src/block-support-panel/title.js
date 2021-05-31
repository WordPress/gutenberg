/**
 * WordPress dependencies
 */
import { check, moreHorizontal } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import MenuGroup from '../menu-group';
import MenuItem from '../menu-item';
import DropdownMenu from '../dropdown-menu';

const BlockSupportPanelTitle = ( props ) => {
	const { menuItems = {}, menuLabel, resetAll, title, toggleControl } = props;

	if ( ! title ) {
		return null;
	}

	return (
		<h2 className="components-block-support-panel__title">
			{ title }
			<DropdownMenu icon={ moreHorizontal } label={ menuLabel }>
				{ ( { onClose } ) => (
					<>
						<MenuGroup label={ __( 'Display options' ) }>
							{ Object.entries( menuItems ).map(
								( [ label, isSelected ] ) => {
									return (
										<MenuItem
											key={ label }
											icon={ isSelected && check }
											isSelected={ isSelected }
											onClick={ () => {
												toggleControl( label );
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
		</h2>
	);
};

export default BlockSupportPanelTitle;
