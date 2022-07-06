/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalHeading as Heading,
	DropdownMenu,
	MenuGroup,
	MenuItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { moreVertical, check, trash } from '@wordpress/icons';

export default function PostStatusHeader() {
	return (
		<HStack className="edit-post-post-status__header">
			<Heading className="edit-post-post-status__heading" level={ 2 }>
				{ __( 'Summary' ) }
			</Heading>
			<DropdownMenu
				icon={ moreVertical }
				label={ __( 'Options' ) }
				toggleProps={ { isSmall: true } }
			>
				{ () => (
					<>
						<MenuGroup>
							<MenuItem
								icon={ check }
								isSelected
								role="menuitemcheckbox"
							>
								{ __( 'Stick to the top' ) }
							</MenuItem>
							<MenuItem
								icon={ check }
								isSelected
								role="menuitemcheckbox"
							>
								{ __( 'Mark as pending' ) }
							</MenuItem>
							<MenuItem>{ __( 'Revision history' ) }</MenuItem>
						</MenuGroup>
						<MenuGroup>
							<MenuItem icon={ trash } isDestructive>
								{ __( 'Move to trash' ) }
							</MenuItem>
						</MenuGroup>
					</>
				) }
			</DropdownMenu>
		</HStack>
	);
}
