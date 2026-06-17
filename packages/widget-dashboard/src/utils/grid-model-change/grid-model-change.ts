/**
 * Internal dependencies
 */
import { migrateLayout } from '../migrate-layout';
import type {
	DashboardWidget,
	WidgetGridModel,
	WidgetGridSettings,
} from '../../types';
import { WIDGET_DASHBOARD_COLUMN_COUNT } from '../../types';

export function getGridModel( settings: WidgetGridSettings ): WidgetGridModel {
	return settings.model ?? 'grid';
}

type ComputeGridModelChangeProps = {
	layout: DashboardWidget[];
	gridSettings: WidgetGridSettings;
	targetModel: WidgetGridModel;
};

type ComputeGridModelChangeResult = {
	layout: DashboardWidget[];
	gridSettings: WidgetGridSettings;
} | null;

/**
 * Computes the staged layout and grid settings after a layout-model change.
 *
 * @param {ComputeGridModelChangeProps} params Layout, current settings, and target model.
 * @return {ComputeGridModelChangeResult} Migrated layout and settings, or `null` when the model is unchanged.
 */
export function computeGridModelChange( {
	layout,
	gridSettings,
	targetModel,
}: ComputeGridModelChangeProps ): ComputeGridModelChangeResult {
	const currentModel = getGridModel( gridSettings );

	if ( currentModel === targetModel ) {
		return null;
	}

	return {
		layout: migrateLayout( layout, currentModel, targetModel, {
			columns: WIDGET_DASHBOARD_COLUMN_COUNT,
		} ),
		gridSettings: {
			...gridSettings,
			model: targetModel,
		} as WidgetGridSettings,
	};
}
