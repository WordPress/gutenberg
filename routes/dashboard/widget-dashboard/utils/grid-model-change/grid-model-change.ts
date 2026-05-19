/**
 * Internal dependencies
 */
import { migrateLayout } from '../migrate-layout';
import type {
	DashboardWidget,
	WidgetGridModel,
	WidgetGridSettings,
} from '../../types';

const DEFAULT_FIXED_COLUMNS = 6;

export function getGridModel( settings: WidgetGridSettings ): WidgetGridModel {
	return settings.model ?? 'grid';
}

/**
 * Computes the staged layout and grid settings after a layout-model change.
 * @param root0
 * @param root0.layout
 * @param root0.gridSettings
 * @param root0.targetModel
 */
export function computeGridModelChange( {
	layout,
	gridSettings,
	targetModel,
}: {
	layout: DashboardWidget[];
	gridSettings: WidgetGridSettings;
	targetModel: WidgetGridModel;
} ): {
	layout: DashboardWidget[];
	gridSettings: WidgetGridSettings;
} | null {
	const currentModel = getGridModel( gridSettings );

	if ( currentModel === targetModel ) {
		return null;
	}

	return {
		layout: migrateLayout( layout, currentModel, targetModel, {
			columns: gridSettings.columns ?? DEFAULT_FIXED_COLUMNS,
		} ),
		gridSettings: {
			...gridSettings,
			model: targetModel,
		} as WidgetGridSettings,
	};
}
