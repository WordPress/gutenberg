/**
 * WordPress dependencies
 */
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import {
	chevronDown as arrowDownIcon,
	check as checkIcon,
} from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ToolbarLinkControlContext from './context';

export default function SettingsMenu() {
	const { currentLink, updateCurrentLink } = useContext(
		ToolbarLinkControlContext
	);
	const { opensInNewTab, rel } = currentLink;
	return (
		<DropdownMenu
			popoverProps={ { position: 'bottom' } }
			className="link-option"
			contentClassName="link-options__popover"
			icon={ arrowDownIcon }
			toggleProps={ {
				label: __( 'Link options' ),
			} }
		>
			{ ( { onClose } ) => (
				<>
					<MenuGroup>
						<MenuItem
							icon={ opensInNewTab && checkIcon }
							onClick={ () => {
								updateCurrentLink( {
									opensInNewTab: ! opensInNewTab,
								} );
							} }
						>
							{ __( 'Open in new tab' ) }
						</MenuItem>
						<MenuItem
							icon={ rel === 'nofollow' && checkIcon }
							onClick={ () => {
								updateCurrentLink( {
									rel:
										currentLink.rel === 'nofollow'
											? ''
											: 'nofollow',
								} );
							} }
						>
							{ __( 'Add nofollow attribute' ) }
						</MenuItem>
					</MenuGroup>
					<MenuGroup>
						<MenuItem
							onClick={ () => {
								updateCurrentLink( {
									url: '',
								} );
								onClose();
							} }
						>
							{ __( 'Remove link' ) }
						</MenuItem>
					</MenuGroup>
				</>
			) }
		</DropdownMenu>
	);
}
