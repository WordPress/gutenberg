import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { unlock } from '../../../../lock-unlock';
import type { StyleToolsPanelProps } from '../../types';

const { ToolsPanel } = unlock( componentsPrivateApis );

export const INHERITANCE_PANEL_LABEL = 'Styles';

/**
 * Accessible name of the reset menu toggle that an inheritance-mode panel
 * renders while any of its controls holds a local value.
 */
export const RESET_MENU_NAME = `Reset ${ INHERITANCE_PANEL_LABEL }`;

/**
 * Renders a Global Styles panel's controls in a `ToolsPanel` using
 * `inheritanceMode`, as the block inspector does with the experiment on.
 * Pass it as a panel's `as` prop.
 *
 * @return The panel.
 */
export function InheritanceToolsPanel( {
	children,
	onChange,
	panelId,
	resetAllFilter,
	value,
}: StyleToolsPanelProps ) {
	return (
		<ToolsPanel
			label={ INHERITANCE_PANEL_LABEL }
			resetAll={ () => onChange( resetAllFilter( value ) ) }
			panelId={ panelId }
			inheritanceMode
		>
			{ children }
		</ToolsPanel>
	);
}
