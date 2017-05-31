/**
 * External dependencies
 */
import { Fill } from 'react-slot-fill';

/**
 * WordPress dependencies
 */
import { ToolbarMenu } from 'components';

export default function BlockMenu( { icon, label, menuLabel, controls } ) {
	return (
		<Fill name="Formatting.ToolbarMenu">
			<ToolbarMenu
				icon={ icon }
				label={ label }
				menuLabel={ menuLabel }
				controls={ controls }
			/>
		</Fill>
	);
}
