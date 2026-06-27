/**
 * Internal dependencies
 */
import type { WidgetGridSettings } from '../../types';
import { WIDGET_DASHBOARD_COLUMN_COUNT } from '../../types';
import { DEFAULT_ROW_HEIGHT } from '../row-height-presets';

/**
 * Canonical default grid settings. Applied by the dashboard when the
 * consumer omits `gridSettings`, and the baseline hosts should treat as
 * the factory default when persisting their own copy.
 */
export const DEFAULT_GRID: WidgetGridSettings = {
	model: 'grid',
	columns: WIDGET_DASHBOARD_COLUMN_COUNT,
	rowHeight: DEFAULT_ROW_HEIGHT,
};
