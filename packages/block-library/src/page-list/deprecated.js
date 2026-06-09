// `isNested` was previously a self-set attribute, derived in the editor from
// whether the block had a `core/navigation-submenu` ancestor. It is now
// provided as block context by `core/navigation-submenu` itself, so the
// attribute is no longer needed and is stripped on migration.
const v1 = {
	attributes: {
		parentPageID: {
			type: 'integer',
			default: 0,
		},
		isNested: {
			type: 'boolean',
			default: false,
		},
	},
	supports: {
		anchor: true,
		reusable: false,
		html: false,
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
		color: {
			text: true,
			background: true,
			link: true,
			gradients: true,
			__experimentalDefaultControls: {
				background: true,
				text: true,
				link: true,
			},
		},
		__experimentalBorder: {
			radius: true,
			color: true,
			width: true,
			style: true,
		},
		spacing: {
			padding: true,
			margin: true,
			__experimentalDefaultControls: {
				padding: false,
				margin: false,
			},
		},
		contentRole: true,
	},
	save: () => null,
	isEligible( attributes ) {
		return 'isNested' in attributes;
	},
	migrate( { isNested, ...rest } ) {
		return rest;
	},
};

export default [ v1 ];
