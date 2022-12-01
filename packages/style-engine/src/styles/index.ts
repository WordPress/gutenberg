/**
 * Internal dependencies
 */
import border from './border';
import color from './color';
import dimensions from './dimensions';
import shadow from './shadow';
import outline from './outline';
import spacing from './spacing';
import typography from './typography';

export const styleDefinitions = [
	...border,
	...color,
	...dimensions,
	...outline,
	...spacing,
	...typography,
	...shadow,
];
