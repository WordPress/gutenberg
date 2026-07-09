/**
 * WordPress dependencies
 */

const v1 = {
	attributes: {
		commentsToShow: {
			type: 'number',
			default: 5,
			minimum: 1,
			maximum: 100,
		},
		displayAvatar: {
			type: 'boolean',
			default: true,
		},
		displayDate: {
			type: 'boolean',
			default: true,
		},
		displayExcerpt: {
			type: 'boolean',
			default: true,
		},
	},
	supports: {
		align: true,
		color: {
			gradients: true,
			link: true,
			__experimentalDefaultControls: {
				background: true,
				text: true,
				link: true,
			},
		},
		html: false,
		spacing: {
			margin: true,
			padding: true,
		},
		typography: {
			fontSize: true,
			lineHeight: true,
			__experimentalFontFamily: true,
			__experimentalFontWeight: true,
			__experimentalFontStyle: true,
			__experimentalTextTransform: true,
			__experimentalTextDecoration: true,
			__experimentalLetterSpacing: true,
			__experimentalDefaultControls: {
				fontSize: true,
			},
		},
		interactivity: {
			clientNavigation: true,
		},
	},
	isEligible( attributes ) {
		return attributes?.displayExcerpt === false;
	},
	migrate( attributes ) {
		return {
			...attributes,
			displayContent: attributes.displayExcerpt ? 'excerpt' : 'none',
		};
	},
};

export default [ v1 ];
