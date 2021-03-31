/**
 * WordPress dependencies
 */
import { Card, CardBody, NavigableMenu } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import AddMenu from '../add-menu';
import MenuSwitcher from '../menu-switcher';

export default function UnselectedMenuState( {
	onCreate,
	onSelectMenu,
	menus,
} ) {
	const showMenuSwitcher = menus?.length > 0;
	return (
		<div className="edit-navigation-empty-state">
			{ showMenuSwitcher && <h4>{ __( 'Choose a menu to edit:' ) }</h4> }
			<Card>
				<CardBody>
					{ showMenuSwitcher ? (
						<NavigableMenu>
							<MenuSwitcher
								onSelectMenu={ onSelectMenu }
								menus={ menus }
							/>
						</NavigableMenu>
					) : (
						<AddMenu
							onCreate={ onCreate }
							titleText={ __( 'Create your first menu' ) }
							helpText={ __(
								'A short descriptive name for your menu.'
							) }
							focusInputOnMount
						/>
					) }
				</CardBody>
			</Card>
		</div>
	);
}
