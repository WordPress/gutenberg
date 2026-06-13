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

type computeGridModelChangeProps = {
	layout: DashboardWidget[];
	gridSettings: WidgetGridSettings;
	targetModel: WidgetGridModel;
};

type computeGridModelChangeResult = {
	layout: DashboardWidget[];
	gridSettings: WidgetGridSettings;
} | null;

/**
 * Computes the staged layout and grid settings after a layout-model change.
 * @param {computeGridModelChangeProps} params - The parameters for the function.
 * @return {computeGridModelChangeResult} The function result.
 */
export function computeGridModelChange( {
	layout,
	gridSettings,
	targetModel,
}: computeGridModelChangeProps ): computeGridModelChangeResult {
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
