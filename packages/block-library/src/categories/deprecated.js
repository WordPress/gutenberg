const migrateDisplayAsDropdown = ( attributes ) => {
	const { displayAsDropdown, ...restAttributes } = attributes;
	return {
		...restAttributes,
		displayLayout: displayAsDropdown ? 'dropdown' : 'list',
	};
};

const v1 = {
	attributes: {
		taxonomy: {
			type: 'string',
			default: 'category',
		},
		displayAsDropdown: {
			type: 'boolean',
			default: false,
		},
		showHierarchy: {
			type: 'boolean',
			default: false,
		},
		showPostCounts: {
			type: 'boolean',
			default: false,
		},
		showOnlyTopLevel: {
			type: 'boolean',
			default: false,
		},
		showEmpty: {
			type: 'boolean',
			default: false,
		},
		label: {
			type: 'string',
		},
		showLabel: {
			type: 'boolean',
			default: true,
		},
	},
	supports: {
		anchor: true,
		align: true,
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
		},
		color: {
			gradients: true,
			link: true,
		},
		__experimentalBorder: {
			radius: true,
			color: true,
			width: true,
			style: true,
		},
	},
	isEligible( { displayAsDropdown } ) {
		return displayAsDropdown !== undefined;
	},
	migrate: migrateDisplayAsDropdown,
	save: () => null,
};

export default [ v1 ];
