import type { WidgetGridLayoutSettings, WidgetGridSettings } from '../../types';

/**
 * Fills in the row height of grid settings. Any finite positive number is
 * honored as-is; an absent or invalid value takes `defaultRowHeight`.
 * Masonry settings pass through, since lane heights follow content.
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

	const { rowHeight } = gridSettings;
	const resolved =
		typeof rowHeight === 'number' &&
		Number.isFinite( rowHeight ) &&
		rowHeight > 0
			? rowHeight
			: defaultRowHeight;

	if ( rowHeight === resolved ) {
		return settings;
	}

	return {
		...gridSettings,
		rowHeight: resolved,
	};
}
