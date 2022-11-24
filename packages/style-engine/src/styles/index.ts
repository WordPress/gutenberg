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
import { getCSSVarFromStyleValue } from './utils';

const styleDefinitions = [
	...border,
	...color,
	...dimensions,
	...outline,
	...spacing,
	...typography,
	...shadow,
];

export { getCSSVarFromStyleValue, styleDefinitions };
