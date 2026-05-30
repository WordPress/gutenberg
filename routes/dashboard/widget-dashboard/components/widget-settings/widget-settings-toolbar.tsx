/**
 * Internal dependencies
 */
import { WidgetToolbar } from '../widget-toolbar';
import { WidgetSettingsTrigger } from './widget-settings-trigger';
import styles from './widget-settings-toolbar.module.css';
import type { DashboardWidget } from '../../types';
import type { WidgetType } from '../../../widget-primitives';

export interface WidgetSettingsToolbarProps {
	/** The instance whose settings this toolbar configures. */
	widget: DashboardWidget< unknown >;

	/** The instance's widget type, for the trigger label and guard. */
	widgetType: WidgetType;
}

/**
 * Normal-mode per-tile toolbar: the gear that opens the settings drawer.
 * Lives in the grid's `actionableArea` slot, so it shows for every
 * `presentation`. Returns `null` when the type has no attributes.
 *
 * @param {WidgetSettingsToolbarProps} props            Component props.
 * @param {DashboardWidget}            props.widget     Instance to edit.
 * @param {WidgetType}                 props.widgetType Type backing it.
 * @return {React.ReactNode} The settings toolbar, or `null`.
 */
export function WidgetSettingsToolbar( {
	widget,
	widgetType,
}: WidgetSettingsToolbarProps ): React.ReactNode {
	if ( ! widgetType.attributes?.length ) {
		return null;
	}

	return (
		<WidgetToolbar className={ styles.widgetSettingsToolbar }>
			<WidgetSettingsTrigger
				widget={ widget }
				widgetType={ widgetType }
			/>
		</WidgetToolbar>
	);
}
