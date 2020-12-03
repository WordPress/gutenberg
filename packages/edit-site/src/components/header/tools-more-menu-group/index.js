/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { MenuGroup } from '@wordpress/components';
import { createSlotFill } from '@wordpress/slot-fill';
import { __ } from '@wordpress/i18n';

const { Fill: ToolsMoreMenuGroup, Slot } = createSlotFill(
	'ToolsMoreMenuGroup'
);

ToolsMoreMenuGroup.Slot = ( { fillProps } ) => (
	<Slot fillProps={ fillProps }>
		{ ( fills ) =>
			! isEmpty( fills ) && (
				<MenuGroup label={ __( 'Tools' ) }>{ fills }</MenuGroup>
			)
		}
	</Slot>
);

export default ToolsMoreMenuGroup;
