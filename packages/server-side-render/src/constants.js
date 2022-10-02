export const ATTRIBUTE_PROPERTY = {
	textColor: [ 'color', 'text' ],
	backgroundColor: [ 'color', 'background' ],
	gradient: [ 'color', 'gradients' ],
	fontSize: [ 'typography', 'fontSize' ],
	fontFamily: [ 'typography', '__experimentalFontFamily' ],
	borderColor: [ '__experimentalBorder', 'color' ],
};

export const STYLE_PROPERTY = {
	color: {
		text: {
			support: [ 'color', 'text' ],
		},
		background: {
			support: [ 'color', 'background' ],
		},
		gradient: {
			support: [ 'color', 'gradients' ],
		},
	},
	typography: {
		fontSize: {
			support: [ 'typography', 'fontSize' ],
		},
		fontWeight: {
			support: [ 'typography', '__experimentalFontWeight' ],
		},
		fontStyle: {
			support: [ 'typography', '__experimentalFontStyle' ],
		},
		textTransform: {
			support: [ 'typography', '__experimentalTextTransform' ],
		},
		leterSpacing: {
			support: [ 'typography', '__experimentalLetterSpacing' ],
		},
		textDecoration: {
			support: [ 'typography', '__experimentalTextDecoration' ],
		},
	},
	spacing: {
		margin: {
			support: [ 'spacing', 'margin' ],
		},
		padding: {
			support: [ 'spacing', 'padding' ],
		},
		blockGap: {
			support: [ 'spacing', 'blockGap' ],
		},
	},
	border: {
		radius: {
			support: [ '__experimentalBorder', 'radius' ],
			subProperties: [
				'topLeft',
				'topRight',
				'bottomRight',
				'bottomLeft',
			],
		},
		color: {
			support: [ '__experimentalBorder', 'color' ],
			additionalProperties: [ 'top', 'right', 'bottom', 'left' ],
		},
		style: {
			support: [ '__experimentalBorder', 'style' ],
			additionalProperties: [ 'top', 'right', 'bottom', 'left' ],
		},
		width: {
			support: [ '__experimentalBorder', 'width' ],
			additionalProperties: [ 'top', 'right', 'bottom', 'left' ],
		},
	},
};
