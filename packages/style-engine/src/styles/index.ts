/**
 * Internal dependencies
 */
import border from './border';
import color from './color';
import shadow from './shadow';
import outline from './outline';
import spacing from './spacing';
import typography from './typography';

export const styleDefinitions = [
	...border,
	...color,
	...outline,
	...spacing,
	...typography,
	...shadow,
];
