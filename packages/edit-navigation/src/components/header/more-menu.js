/**
 * WordPress dependencies
 */
import { MenuGroup, MenuItem, VisuallyHidden } from '@wordpress/components';
import { external } from '@wordpress/icons';
import { MoreMenuDropdown } from '@wordpress/interface';
import { __ } from '@wordpress/i18n';

export default function MoreMenu() {
	return (
		<MoreMenuDropdown>
			{ () => (
				<MenuGroup label={ __( 'Tools' ) }>
					<MenuItem
						role="menuitem"
						icon={ external }
						href="https://github.com/WordPress/gutenberg/tree/trunk/packages/edit-navigation/docs/user-documentation.md"
						target="_blank"
						rel="noopener noreferrer"
					>
						{ __( 'Help' ) }
						<VisuallyHidden as="span">
							{
								/* translators: accessibility text */
								__( '(opens in a new tab)' )
							}
						</VisuallyHidden>
					</MenuItem>
				</MenuGroup>
			) }
		</MoreMenuDropdown>
	);
}
