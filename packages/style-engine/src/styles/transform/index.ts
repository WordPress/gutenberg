import type { Style, StyleOptions } from '../../types';
import type { generateRule } from '../utils';

// Mirror of `WP_Style_Engine::VALID_ANGLE_PATTERN` in PHP.
const VALID_ANGLE_PATTERN =
	/^(?:[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:deg|grad|rad|turn)|0)$/i;

const rotate = {
	name: 'rotate',
	generate: (
		style: Style,
		options: StyleOptions
	): ReturnType< typeof generateRule > => {
		const value = style?.transform?.rotate;

		// Lists, functions such as `calc()` or `var()`, and bare numbers are
		// not a single angle.
		if (
			typeof value !== 'string' ||
			! VALID_ANGLE_PATTERN.test( value )
		) {
			return [];
		}

		return [
			{
				selector: options.selector,
				key: 'rotate',
				value,
			},
		];
	},
};

export default [ rotate ];
