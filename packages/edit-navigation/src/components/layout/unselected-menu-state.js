/**
 * WordPress dependencies
 */
import { Card, CardBody } from '@wordpress/components';
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
	return (
		<Card className="edit-navigation-empty-state">
			<CardBody>
				{ menus?.length ? (
					<MenuSwitcher
						onSelectMenu={ onSelectMenu }
						menus={ menus }
					/>
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
	);
}
