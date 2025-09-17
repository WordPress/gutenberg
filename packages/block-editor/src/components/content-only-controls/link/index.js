/**
 * WordPress dependencies
 */
import { __experimentalToolsPanelItem as ToolsPanelItem } from '@wordpress/components';

export default function Link( {
	clientId,
	control,
	blockType,
	attributeValues,
	updateAttributes,
} ) {
	return (
		<ToolsPanelItem
			panelId={ clientId }
			label={ control.label }
			hasValue={ () => false } // TODO.
			onDeselect={ () => {
				// TODO.
			} }
			isShownByDefault={ control.shownByDefault }
		>
			Link
		</ToolsPanelItem>
	);
}
