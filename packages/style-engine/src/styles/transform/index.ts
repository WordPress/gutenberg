import type { Style, StyleOptions } from '../../types';
import type { generateRule } from '../utils';

// Mirror of `WP_Style_Engine::VALID_ANGLE_PATTERN` in PHP.
const VALID_ANGLE_PATTERN =
	/^(?:[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:deg|grad|rad|turn)|0)$/i;

// Mirror of `WP_Style_Engine::VALID_LENGTH_PERCENTAGE_PATTERN` in PHP.
const VALID_LENGTH_PERCENTAGE_PATTERN =
	/^(?:[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:%|px|cm|mm|q|in|pt|pc|r?em|r?ex|r?ch|r?cap|r?ic|r?lh|[sld]?v(?:w|h|i|b|min|max)|cq(?:w|h|i|b|min|max))|0)$/i;

// Mirror of `WP_Style_Engine::VALID_SCALE_PATTERN` in PHP.
const VALID_SCALE_PATTERN = /^(?:\d+(?:\.\d+)?|\.\d+)%?$/;

/**
 * Returns a scale value as a CSS string. Mirror of
 * `WP_Style_Engine::get_scale_css_declarations()` in PHP.
 *
 * @param value A raw scale value, such as `1.2` or `'120%'`.
 *
 * @return The scale as a CSS string, or `undefined` if it is not a single
 * non-negative number or percentage.
 */
function getScaleCSSValue( value: unknown ): string | undefined {
	const scale =
		typeof value === 'number' && Number.isFinite( value )
			? String( value )
			: value;
	return typeof scale === 'string' && VALID_SCALE_PATTERN.test( scale )
		? scale
		: undefined;
}

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

		// Each axis is its own custom property, so a layer that sets one axis
		// leaves the other to the layers below it.
		const rules = [];
		for ( const axis of [ 'x', 'y' ] as const ) {
			const axisValue = value[ axis ];
			if ( axisValue === undefined || axisValue === null ) {
				continue;
			}
			if (
				typeof axisValue !== 'string' ||
				! VALID_LENGTH_PERCENTAGE_PATTERN.test( axisValue )
			) {
				return [];
			}
			rules.push( {
				selector: options.selector,
				key: `--wp--style--translate-${ axis }`,
				value: axisValue,
			} );
		}

		return [
			...rules,
			{
				selector: options.selector,
				key: 'translate',
				value: 'var(--wp--style--translate-x, 0) var(--wp--style--translate-y, 0)',
			},
		];
	},
};

const scale = {
	name: 'scale',
	generate: (
		style: Style,
		options: StyleOptions
	): ReturnType< typeof generateRule > => {
		const value = getScaleCSSValue( style?.transform?.scale );
		if ( value === undefined ) {
			return [];
		}

		return [
			{
				selector: options.selector,
				key: 'scale',
				value,
			},
		];
	},
};

export default [ rotate, translate, scale ];
