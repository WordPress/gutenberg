import type { WidgetGridLayoutSettings, WidgetGridSettings } from '../../types';
import { snapRowHeight } from '../row-height-presets';

/**
 * Coerces legacy grid row heights to a dashboard preset. Standard grid
 * rows always use uniform track sizing so tiles align with the masonry
 * model boundary.
 *
 * @param settings         Grid settings to normalize.
 * @param defaultRowHeight Fallback row height when none is set.
 */
export function normalizeGridSettings(
	settings: WidgetGridSettings,
	defaultRowHeight: number
): WidgetGridSettings {
	if ( ( settings.model ?? 'grid' ) === 'masonry' ) {
		return settings;
	}

	// The guard above cannot narrow the union for TypeScript: `model` is
	// optional and the check goes through `??`.
	const gridSettings = settings as WidgetGridLayoutSettings;

	const rowHeight = gridSettings.rowHeight;
	const resolved =
		typeof rowHeight === 'number'
			? snapRowHeight( rowHeight )
			: defaultRowHeight;

	if ( rowHeight === resolved ) {
		return settings;
	}

	return {
		...gridSettings,
		rowHeight: resolved,
	};
}
