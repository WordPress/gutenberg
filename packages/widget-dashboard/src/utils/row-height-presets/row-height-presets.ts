export const ROW_HEIGHT_PRESETS = {
	small: 200,
	medium: 300,
	large: 400,
} as const;

export type RowHeightPreset = keyof typeof ROW_HEIGHT_PRESETS;

export const DEFAULT_ROW_HEIGHT = ROW_HEIGHT_PRESETS.medium;

const PRESET_ENTRIES = Object.entries( ROW_HEIGHT_PRESETS ) as [
	RowHeightPreset,
	number,
][];

/**
 * Maps a stored pixel height to the nearest preset so legacy freeform
 * values still resolve to a valid toggle option.
 *
 * @param rowHeight Row height in pixels.
 */
export function rowHeightToPreset( rowHeight: number ): RowHeightPreset {
	let closest: RowHeightPreset = 'medium';
	let minDistance = Infinity;

	for ( const [ preset, value ] of PRESET_ENTRIES ) {
		const distance = Math.abs( rowHeight - value );
		if ( distance < minDistance ) {
			minDistance = distance;
			closest = preset;
		}
	}

	return closest;
}

export function presetToRowHeight( preset: RowHeightPreset ): number {
	return ROW_HEIGHT_PRESETS[ preset ];
}

export function snapRowHeight( rowHeight: number ): number {
	return presetToRowHeight( rowHeightToPreset( rowHeight ) );
}
