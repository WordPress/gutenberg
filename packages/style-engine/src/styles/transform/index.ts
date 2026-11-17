import type { Style, StyleOptions } from '../../types';
import type { generateRule } from '../utils';

// Mirror of `WP_Style_Engine::VALID_ANGLE_PATTERN` in PHP.
const VALID_ANGLE_PATTERN =
	/^(?:[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:deg|grad|rad|turn)|0)$/i;

// Mirror of `WP_Style_Engine::VALID_LENGTH_PERCENTAGE_PATTERN` in PHP.
const VALID_LENGTH_PERCENTAGE_PATTERN =
	/^(?:[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:%|px|cm|mm|q|in|pt|pc|r?em|r?ex|r?ch|r?cap|r?ic|r?lh|[sld]?v(?:w|h|i|b|min|max)|cq(?:w|h|i|b|min|max))|0)$/i;

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

// Mirror of `WP_Style_Engine::get_translate_css_declarations()` in PHP.
const translate = {
	name: 'translate',
	generate: (
		style: Style,
		options: StyleOptions
	): ReturnType< typeof generateRule > => {
		const value = style?.transform?.translate;
		if (
			! value ||
			typeof value !== 'object' ||
			( ( value.x ?? null ) === null && ( value.y ?? null ) === null )
		) {
			return [];
		}

		const axes = [ value.x ?? '0', value.y ?? '0' ];
		if (
			! axes.every(
				( axis ) =>
					typeof axis === 'string' &&
					VALID_LENGTH_PERCENTAGE_PATTERN.test( axis )
			)
		) {
			return [];
		}

		return [
			{
				selector: options.selector,
				key: 'translate',
				value: axes.join( ' ' ),
			},
		];
	},
};

export default [ rotate, translate ];
