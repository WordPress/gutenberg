/**
 * WordPress dependencies
 */
import {
	privateApis as componentsPrivateApis,
	Icon,
	Button,
} from '@wordpress/components';
import { chevronDown, check } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { DropdownMenuV2, DropdownMenuItemV2 } = unlock( componentsPrivateApis );

export default function AddFilter( {} ) {
	return (
		<DropdownMenuV2
			trigger={
				<Button variant="tertiary">
					{ __( 'Filters' ) }
					<Icon icon={ chevronDown } />
				</Button>
			}
		>
			<DropdownMenuItemV2
				key="one"
				prefix={ <Icon icon={ check } /> }
				role="menuitemcheckbox"
			>
				{ 'Filter one' }
			</DropdownMenuItemV2>
			<DropdownMenuItemV2 key="two" role="menuitemcheckbox">
				{ 'Filter two' }
			</DropdownMenuItemV2>
		</DropdownMenuV2>
	);
}
