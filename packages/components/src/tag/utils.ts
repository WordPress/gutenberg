/**
 * Internal dependencies
 */
import type { SupportedColors } from '../utils/backgrounds';

export const TAG_COLORS: Record<
	SupportedColors | 'standard',
	SupportedColors
> = {
	blue: 'blue',
	green: 'green',
	orange: 'orange',
	purple: 'purple',
	red: 'red',
	standard: 'darkGray',
	yellow: 'yellow',
	darkGray: 'darkGray',
	lightGray: 'lightGray',
};
