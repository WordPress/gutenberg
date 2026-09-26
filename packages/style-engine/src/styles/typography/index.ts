import type { Style, StyleOptions } from '../../types';
import { generateRule } from '../utils';

const fontSize = {
	name: 'fontSize',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			options,
			[ 'typography', 'fontSize' ],
			'fontSize'
		);
	},
};

const fontStyle = {
	name: 'fontStyle',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			options,
			[ 'typography', 'fontStyle' ],
			'fontStyle'
		);
	},
};

const fontWeight = {
	name: 'fontWeight',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			options,
			[ 'typography', 'fontWeight' ],
			'fontWeight'
		);
	},
};

// These axes have high-level properties (`font-weight`, `font-stretch`,
// `font-style`). Setting them in `font-variation-settings` would override those,
// for example keeping a `<strong>` from getting bolder.
const REGISTERED_AXES_WITH_PROPERTIES = [ 'wght', 'wdth', 'slnt', 'ital' ];

/**
 * Serializes font variation settings stored as an object keyed by axis tag.
 * Only four-character letter-or-digit tags with finite number values are kept,
 * matching the PHP style engine, and
 * the axes above are skipped; `opsz` stays, as `font-optical-sizing` only
 * switches it on or off.
 *
 * @param value Axis values keyed by tag, e.g. `{ GRAD: 50 }`.
 * @return The CSS value, or undefined when no axis is left.
 */
export function serializeFontVariationSettings(
	value: unknown
): string | undefined {
	if ( ! value || typeof value !== 'object' || Array.isArray( value ) ) {
		return undefined;
	}
	const settings = Object.entries( value as Record< string, unknown > )
		.filter(
			( [ tag, axisValue ] ) =>
				/^[A-Za-z0-9]{4}$/.test( tag ) &&
				! REGISTERED_AXES_WITH_PROPERTIES.includes( tag ) &&
				typeof axisValue === 'number' &&
				Number.isFinite( axisValue )
		)
		.map( ( [ tag, axisValue ] ) => `"${ tag }" ${ axisValue }` );
	return settings.length ? settings.join( ', ' ) : undefined;
}

const fontVariationSettings = {
	name: 'fontVariationSettings',
	generate: ( style: Style, options: StyleOptions ) => {
		const value = serializeFontVariationSettings(
			style?.typography?.fontVariationSettings
		);
		return value
			? [
					{
						selector: options?.selector,
						key: 'fontVariationSettings',
						value,
					},
				]
			: [];
	},
};

const fontFamily = {
	name: 'fontFamily',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			options,
			[ 'typography', 'fontFamily' ],
			'fontFamily'
		);
	},
};

const letterSpacing = {
	name: 'letterSpacing',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			options,
			[ 'typography', 'letterSpacing' ],
			'letterSpacing'
		);
	},
};

const lineHeight = {
	name: 'lineHeight',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			options,
			[ 'typography', 'lineHeight' ],
			'lineHeight'
		);
	},
};

const textColumns = {
	name: 'textColumns',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			options,
			[ 'typography', 'textColumns' ],
			'columnCount'
		);
	},
};

const textDecoration = {
	name: 'textDecoration',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			options,
			[ 'typography', 'textDecoration' ],
			'textDecoration'
		);
	},
};

const textIndent = {
	name: 'textIndent',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			options,
			[ 'typography', 'textIndent' ],
			'textIndent'
		);
	},
};

const textTransform = {
	name: 'textTransform',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			options,
			[ 'typography', 'textTransform' ],
			'textTransform'
		);
	},
};

const writingMode = {
	name: 'writingMode',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			options,
			[ 'typography', 'writingMode' ],
			'writingMode'
		);
	},
};

const textShadow = {
	name: 'textShadow',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			options,
			[ 'typography', 'textShadow' ],
			'textShadow'
		);
	},
};

export default [
	fontFamily,
	fontSize,
	fontStyle,
	fontVariationSettings,
	fontWeight,
	letterSpacing,
	lineHeight,
	textColumns,
	textDecoration,
	textIndent,
	textShadow,
	textTransform,
	writingMode,
];
