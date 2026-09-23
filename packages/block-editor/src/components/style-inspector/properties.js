import { __ } from '@wordpress/i18n';

/**
 * The properties the inspector lists, grouped like the block inspector's
 * panels. Each maps the CSS longhands it reads to the Global Styles / block
 * `style` attribute path that sets it, so the first, cheap pass can say where
 * a value is *declared* without touching a stylesheet.
 *
 * - `longhands`: CSS properties read with `getComputedStyle` and traced.
 * - `stylePath`: dot path in `styles.*` and in the block's `style` attribute.
 * - `stylePaths`: several such paths, when more than one setting writes the
 *   same CSS property (a gradient and a background image both paint
 *   `background-image`).
 * - `presetAttribute`: block attribute that holds a preset slug for it.
 * - `inherits`: whether CSS inherits it from the parent element, which is
 *   when an ancestor block can be the real source.
 */
export function getInspectorGroups() {
	return [
		{
			name: 'color',
			label: __( 'Color' ),
			properties: [
				{
					label: __( 'Text' ),
					longhands: [ 'color' ],
					stylePath: 'color.text',
					presetAttribute: 'textColor',
					inherits: true,
					isColor: true,
				},
				{
					label: __( 'Background' ),
					longhands: [ 'background-color' ],
					stylePath: 'color.background',
					presetAttribute: 'backgroundColor',
					isColor: true,
				},
				{
					label: __( 'Background image' ),
					longhands: [ 'background-image' ],
					stylePaths: [
						'color.gradient',
						'background.backgroundImage',
						'background.gradient',
					],
					presetAttribute: 'gradient',
				},
			],
		},
		{
			name: 'background',
			label: __( 'Background' ),
			properties: [
				{
					label: __( 'Size' ),
					longhands: [ 'background-size' ],
					stylePath: 'background.backgroundSize',
				},
				{
					label: __( 'Position' ),
					shorthand: 'background-position',
					longhands: [
						'background-position-x',
						'background-position-y',
					],
					stylePath: 'background.backgroundPosition',
				},
				{
					label: __( 'Repeat' ),
					longhands: [ 'background-repeat' ],
					stylePath: 'background.backgroundRepeat',
				},
				{
					label: __( 'Attachment' ),
					longhands: [ 'background-attachment' ],
					stylePath: 'background.backgroundAttachment',
				},
			],
		},
		{
			name: 'typography',
			label: __( 'Typography' ),
			properties: [
				{
					label: __( 'Font' ),
					longhands: [ 'font-family' ],
					stylePath: 'typography.fontFamily',
					presetAttribute: 'fontFamily',
					inherits: true,
				},
				{
					label: __( 'Size' ),
					longhands: [ 'font-size' ],
					stylePath: 'typography.fontSize',
					presetAttribute: 'fontSize',
					inherits: true,
				},
				{
					label: __( 'Weight' ),
					longhands: [ 'font-weight' ],
					stylePath: 'typography.fontWeight',
					inherits: true,
				},
				{
					label: __( 'Style' ),
					longhands: [ 'font-style' ],
					stylePath: 'typography.fontStyle',
					inherits: true,
				},
				{
					label: __( 'Line height' ),
					longhands: [ 'line-height' ],
					stylePath: 'typography.lineHeight',
					inherits: true,
				},
				{
					label: __( 'Letter spacing' ),
					longhands: [ 'letter-spacing' ],
					stylePath: 'typography.letterSpacing',
					inherits: true,
				},
				{
					label: __( 'Letter case' ),
					longhands: [ 'text-transform' ],
					stylePath: 'typography.textTransform',
					inherits: true,
				},
				{
					label: __( 'Decoration' ),
					longhands: [ 'text-decoration-line' ],
					stylePath: 'typography.textDecoration',
				},
				{
					label: __( 'Alignment' ),
					longhands: [ 'text-align' ],
					stylePath: 'typography.textAlign',
					inherits: true,
				},
				{
					label: __( 'Indent' ),
					longhands: [ 'text-indent' ],
					stylePath: 'typography.textIndent',
					inherits: true,
				},
				{
					label: __( 'Text shadow' ),
					longhands: [ 'text-shadow' ],
					stylePath: 'typography.textShadow',
					inherits: true,
				},
				{
					label: __( 'Orientation' ),
					longhands: [ 'writing-mode' ],
					stylePath: 'typography.writingMode',
					inherits: true,
				},
				{
					label: __( 'Columns' ),
					longhands: [ 'column-count' ],
					stylePath: 'typography.textColumns',
				},
			],
		},
		{
			name: 'dimensions',
			label: __( 'Dimensions' ),
			properties: [
				{
					label: __( 'Padding' ),
					shorthand: 'padding',
					longhands: [
						'padding-top',
						'padding-right',
						'padding-bottom',
						'padding-left',
					],
					stylePath: 'spacing.padding',
				},
				{
					label: __( 'Margin' ),
					shorthand: 'margin',
					longhands: [
						'margin-top',
						'margin-right',
						'margin-bottom',
						'margin-left',
					],
					stylePath: 'spacing.margin',
				},
				{
					label: __( 'Block spacing' ),
					shorthand: 'gap',
					longhands: [ 'row-gap', 'column-gap' ],
					stylePath: 'spacing.blockGap',
				},
				{
					label: __( 'Width' ),
					longhands: [ 'width' ],
					stylePath: 'dimensions.width',
				},
				{
					label: __( 'Height' ),
					longhands: [ 'height' ],
					stylePath: 'dimensions.height',
				},
				{
					label: __( 'Minimum width' ),
					longhands: [ 'min-width' ],
					stylePath: 'dimensions.minWidth',
				},
				{
					label: __( 'Minimum height' ),
					longhands: [ 'min-height' ],
					stylePath: 'dimensions.minHeight',
				},
				{
					label: __( 'Aspect ratio' ),
					longhands: [ 'aspect-ratio' ],
					stylePath: 'dimensions.aspectRatio',
				},
				{
					label: __( 'Position' ),
					longhands: [ 'position' ],
					stylePath: 'position.type',
				},
			],
		},
		{
			name: 'border',
			label: __( 'Border & Shadow' ),
			properties: [
				{
					label: __( 'Border width' ),
					shorthand: 'border-width',
					longhands: [
						'border-top-width',
						'border-right-width',
						'border-bottom-width',
						'border-left-width',
					],
					stylePath: 'border.width',
				},
				{
					label: __( 'Border style' ),
					// Meaningless while there is no border to paint.
					needsBorder: true,
					shorthand: 'border-style',
					longhands: [
						'border-top-style',
						'border-right-style',
						'border-bottom-style',
						'border-left-style',
					],
					stylePath: 'border.style',
				},
				{
					label: __( 'Border color' ),
					// Meaningless while there is no border to paint.
					needsBorder: true,
					shorthand: 'border-color',
					longhands: [
						'border-top-color',
						'border-right-color',
						'border-bottom-color',
						'border-left-color',
					],
					stylePath: 'border.color',
					presetAttribute: 'borderColor',
					isColor: true,
				},
				{
					label: __( 'Radius' ),
					shorthand: 'border-radius',
					longhands: [
						'border-top-left-radius',
						'border-top-right-radius',
						'border-bottom-right-radius',
						'border-bottom-left-radius',
					],
					stylePath: 'border.radius',
				},
				{
					label: __( 'Shadow' ),
					longhands: [ 'box-shadow' ],
					stylePath: 'shadow',
				},
				{
					label: __( 'Filter' ),
					longhands: [ 'filter' ],
					stylePath: 'filter.duotone',
				},
			],
		},
	];
}

/**
 * Collapses per-side values the way CSS shorthands do: one value when every
 * side matches, otherwise all of them.
 *
 * @param {string[]} values Longhand values, in `longhands` order.
 * @return {string} Display value.
 */
export function compactValues( values ) {
	if ( values.every( ( value ) => value === values[ 0 ] ) ) {
		return values[ 0 ];
	}
	if ( values.length === 4 && values[ 1 ] === values[ 3 ] ) {
		return values[ 0 ] === values[ 2 ]
			? `${ values[ 0 ] } ${ values[ 1 ] }`
			: `${ values[ 0 ] } ${ values[ 1 ] } ${ values[ 2 ] }`;
	}
	return values.join( ' ' );
}

/**
 * The Styles paths a property can be set at.
 *
 * @param {Object} property Property from `getInspectorGroups`.
 * @return {string[]} Dot paths.
 */
export function getStylePaths( property ) {
	return (
		property.stylePaths ??
		( property.stylePath ? [ property.stylePath ] : [] )
	);
}
