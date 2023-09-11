export const BLOCK_ICON_DEFAULT = 'block-default';

/**
 * Array of valid keys in a block type settings deprecation object.
 *
 * @type {string[]}
 */
export const DEPRECATED_ENTRY_KEYS = [
	'attributes',
	'supports',
	'save',
	'migrate',
	'isEligible',
	'apiVersion',
];

export const __EXPERIMENTAL_STYLE_PROPERTY = {
	// Kept for back-compatibility purposes.
	'--wp--style--color--link': {
		value: [ 'color', 'link' ],
		support: [ 'color', 'link' ],
	},
	background: {
		value: [ 'color', 'gradient' ],
		support: [ 'color', 'gradients' ],
		useEngine: true,
	},
	backgroundColor: {
		value: [ 'color', 'background' ],
		support: [ 'color', 'background' ],
		requiresOptOut: true,
		useEngine: true,
	},
	borderColor: {
		value: [ 'border', 'color' ],
		support: [ '__experimentalBorder', 'color' ],
		useEngine: true,
	},
	borderRadius: {
		value: [ 'border', 'radius' ],
		support: [ '__experimentalBorder', 'radius' ],
		properties: {
			borderTopLeftRadius: 'topLeft',
			borderTopRightRadius: 'topRight',
			borderBottomLeftRadius: 'bottomLeft',
			borderBottomRightRadius: 'bottomRight',
		},
		useEngine: true,
	},
	borderStyle: {
		value: [ 'border', 'style' ],
		support: [ '__experimentalBorder', 'style' ],
		useEngine: true,
	},
	borderWidth: {
		value: [ 'border', 'width' ],
		support: [ '__experimentalBorder', 'width' ],
		useEngine: true,
	},
	borderTopColor: {
		value: [ 'border', 'top', 'color' ],
		support: [ '__experimentalBorder', 'color' ],
		useEngine: true,
	},
	borderTopStyle: {
		value: [ 'border', 'top', 'style' ],
		support: [ '__experimentalBorder', 'style' ],
		useEngine: true,
	},
	borderTopWidth: {
		value: [ 'border', 'top', 'width' ],
		support: [ '__experimentalBorder', 'width' ],
		useEngine: true,
	},
	borderRightColor: {
		value: [ 'border', 'right', 'color' ],
		support: [ '__experimentalBorder', 'color' ],
		useEngine: true,
	},
	borderRightStyle: {
		value: [ 'border', 'right', 'style' ],
		support: [ '__experimentalBorder', 'style' ],
		useEngine: true,
	},
	borderRightWidth: {
		value: [ 'border', 'right', 'width' ],
		support: [ '__experimentalBorder', 'width' ],
		useEngine: true,
	},
	borderBottomColor: {
		value: [ 'border', 'bottom', 'color' ],
		support: [ '__experimentalBorder', 'color' ],
		useEngine: true,
	},
	borderBottomStyle: {
		value: [ 'border', 'bottom', 'style' ],
		support: [ '__experimentalBorder', 'style' ],
		useEngine: true,
	},
	borderBottomWidth: {
		value: [ 'border', 'bottom', 'width' ],
		support: [ '__experimentalBorder', 'width' ],
		useEngine: true,
	},
	borderLeftColor: {
		value: [ 'border', 'left', 'color' ],
		support: [ '__experimentalBorder', 'color' ],
		useEngine: true,
	},
	borderLeftStyle: {
		value: [ 'border', 'left', 'style' ],
		support: [ '__experimentalBorder', 'style' ],
		useEngine: true,
	},
	borderLeftWidth: {
		value: [ 'border', 'left', 'width' ],
		support: [ '__experimentalBorder', 'width' ],
		useEngine: true,
	},
	color: {
		value: [ 'color', 'text' ],
		support: [ 'color', 'text' ],
		requiresOptOut: true,
		useEngine: true,
	},
	columnCount: {
		value: [ 'typography', 'textColumns' ],
		support: [ 'typography', 'textColumns' ],
		useEngine: true,
	},
	filter: {
		value: [ 'filter', 'duotone' ],
		support: [ 'filter', 'duotone' ],
	},
	linkColor: {
		value: [ 'elements', 'link', 'color', 'text' ],
		support: [ 'color', 'link' ],
	},
	captionColor: {
		value: [ 'elements', 'caption', 'color', 'text' ],
		support: [ 'color', 'caption' ],
	},
	buttonColor: {
		value: [ 'elements', 'button', 'color', 'text' ],
		support: [ 'color', 'button' ],
	},
	buttonBackgroundColor: {
		value: [ 'elements', 'button', 'color', 'background' ],
		support: [ 'color', 'button' ],
	},
	headingColor: {
		value: [ 'elements', 'heading', 'color', 'text' ],
		support: [ 'color', 'heading' ],
	},
	headingBackgroundColor: {
		value: [ 'elements', 'heading', 'color', 'background' ],
		support: [ 'color', 'heading' ],
	},
	fontFamily: {
		value: [ 'typography', 'fontFamily' ],
		support: [ 'typography', '__experimentalFontFamily' ],
		useEngine: true,
	},
	fontSize: {
		value: [ 'typography', 'fontSize' ],
		support: [ 'typography', 'fontSize' ],
		useEngine: true,
	},
	fontStyle: {
		value: [ 'typography', 'fontStyle' ],
		support: [ 'typography', '__experimentalFontStyle' ],
		useEngine: true,
	},
	fontWeight: {
		value: [ 'typography', 'fontWeight' ],
		support: [ 'typography', '__experimentalFontWeight' ],
		useEngine: true,
	},
	lineHeight: {
		value: [ 'typography', 'lineHeight' ],
		support: [ 'typography', 'lineHeight' ],
		useEngine: true,
	},
	margin: {
		value: [ 'spacing', 'margin' ],
		support: [ 'spacing', 'margin' ],
		properties: {
			marginTop: 'top',
			marginRight: 'right',
			marginBottom: 'bottom',
			marginLeft: 'left',
		},
		useEngine: true,
	},
	minHeight: {
		value: [ 'dimensions', 'minHeight' ],
		support: [ 'dimensions', 'minHeight' ],
		useEngine: true,
	},
	padding: {
		value: [ 'spacing', 'padding' ],
		support: [ 'spacing', 'padding' ],
		properties: {
			paddingTop: 'top',
			paddingRight: 'right',
			paddingBottom: 'bottom',
			paddingLeft: 'left',
		},
		useEngine: true,
	},
	textDecoration: {
		value: [ 'typography', 'textDecoration' ],
		support: [ 'typography', '__experimentalTextDecoration' ],
		useEngine: true,
	},
	textTransform: {
		value: [ 'typography', 'textTransform' ],
		support: [ 'typography', '__experimentalTextTransform' ],
		useEngine: true,
	},
	letterSpacing: {
		value: [ 'typography', 'letterSpacing' ],
		support: [ 'typography', '__experimentalLetterSpacing' ],
		useEngine: true,
	},
	writingMode: {
		value: [ 'typography', 'writingMode' ],
		support: [ 'typography', '__experimentalWritingMode' ],
		useEngine: true,
	},
	'--wp--style--root--padding': {
		value: [ 'spacing', 'padding' ],
		support: [ 'spacing', 'padding' ],
		properties: {
			'--wp--style--root--padding-top': 'top',
			'--wp--style--root--padding-right': 'right',
			'--wp--style--root--padding-bottom': 'bottom',
			'--wp--style--root--padding-left': 'left',
		},
		rootOnly: true,
	},
};

export const __EXPERIMENTAL_ELEMENTS = {
	link: 'a',
	heading: 'h1, h2, h3, h4, h5, h6',
	h1: 'h1',
	h2: 'h2',
	h3: 'h3',
	h4: 'h4',
	h5: 'h5',
	h6: 'h6',
	button: '.wp-element-button, .wp-block-button__link',
	caption:
		'.wp-element-caption, .wp-block-audio figcaption, .wp-block-embed figcaption, .wp-block-gallery figcaption, .wp-block-image figcaption, .wp-block-table figcaption, .wp-block-video figcaption',
	cite: 'cite',
};

export const __EXPERIMENTAL_PATHS_WITH_MERGE = {
	'color.duotone': true,
	'color.gradients': true,
	'color.palette': true,
	'typography.fontFamilies': true,
	'typography.fontSizes': true,
	'spacing.spacingSizes': true,
};
