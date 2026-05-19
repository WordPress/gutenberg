/**
 * Internal dependencies
 */
import {
	computeGridModelChange,
	getGridModel,
} from '../../utils/grid-model-change';
import type {
	DashboardWidget,
	WidgetGridModel,
	WidgetGridSettings,
} from '../../types';

export { getGridModel, computeGridModelChange };

/**
 * Applies a layout-model change the same way the layout settings drawer does:
 * migrates widget placements, then updates the staged grid settings.
 * @param root0
 * @param root0.layout
 * @param root0.gridSettings
 * @param root0.targetModel
 * @param root0.onLayoutChange
 * @param root0.onGridSettingsChange
 */
export function applyGridModelChange( {
	layout,
	gridSettings,
	targetModel,
	onLayoutChange,
	onGridSettingsChange,
}: {
	layout: DashboardWidget[];
	gridSettings: WidgetGridSettings;
	targetModel: WidgetGridModel;
	onLayoutChange: ( layout: DashboardWidget[] ) => void;
	onGridSettingsChange: ( gridSettings: WidgetGridSettings ) => void;
} ): void {
	const next = computeGridModelChange( {
		layout,
		gridSettings,
		targetModel,
	} );

	if ( ! next ) {
		return;
	}

	onLayoutChange( next.layout );
	onGridSettingsChange( next.gridSettings );
}
