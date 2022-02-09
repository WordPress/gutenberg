const deprecated = [
	{
		attributes: {
			textAlign: {
				type: 'string',
			},
			moreText: {
				type: 'string',
			},
			showMoreOnNewLine: {
				type: 'boolean',
				default: true,
			},
		},
		supports: {
			html: false,
			color: {
				gradients: true,
				link: true,
				__experimentalDefaultControls: {
					background: true,
					text: true,
					link: true,
				},
			},
			spacing: {
				margin: true,
				padding: true,
			},
			typography: {
				fontSize: true,
				lineHeight: true,
				__experimentalFontStyle: true,
				__experimentalFontWeight: true,
				__experimentalLetterSpacing: true,
				__experimentalTextTransform: true,
				__experimentalDefaultControls: {
					fontSize: true,
				},
			},
		},
		isEligible( { moreText, addMoreText } ) {
			return !! moreText && addMoreText === undefined;
		},
		migrate( attributes ) {
			return { ...attributes, addMoreText: true };
		},
		save() {},
	},
];

export default deprecated;
