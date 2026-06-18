/**
 * WordPress dependencies
 */
import type { WidgetType } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { WidgetToolbar } from '../widget-toolbar';
import { WidgetSettingsTrigger } from './widget-settings-trigger';
import styles from './widget-settings-toolbar.module.css';
import type { DashboardWidget } from '../../types';

export interface WidgetSettingsToolbarProps {
	/** The instance whose settings this toolbar configures. */
	widget: DashboardWidget< unknown >;

	/** The instance's widget type, for the trigger label and guard. */
	widgetType: WidgetType;
}

/**
 * Normal-mode per-tile toolbar: the gear that opens the settings drawer. Lives
 * in the grid's `actionableArea` slot, so it shows for every `presentation`.
 * Returns `null` when the type has no attributes.
 *
 * @param {WidgetSettingsToolbarProps} props Component props.
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
