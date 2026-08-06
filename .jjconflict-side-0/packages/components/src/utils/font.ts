import FONT from './font-values';

/**
 *
 * @param value Path of value from `FONT`
 * @return Font rule value
 */
export function font( value: keyof typeof FONT ) {
	return FONT[ value ] ?? '';
}
