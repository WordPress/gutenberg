/**
 * The search block stored its width as a number plus a separate unit
 * (`width: 50`, `widthUnit: '%'`) before adopting the `dimensions.width` block
 * support. Move both into the single CSS length the support expects, unless a
 * block support width is already set.
 *
 * @param {Object} attributes Block attributes.
 *
 * @return {Object} Block attributes with the width moved under `style`.
 */
const migrateWidth = ( attributes ) => {
	const { width, widthUnit, ...otherAttributes } = attributes;

	// A block that already carries a block support width keeps it. The server
	// reads `style.dimensions.width` before the legacy attributes, so the
	// editor has to resolve the two the same way.
	if ( ! width || ! widthUnit || otherAttributes.style?.dimensions?.width ) {
		return otherAttributes;
	}

	return {
		...otherAttributes,
		style: {
			...otherAttributes.style,
			dimensions: {
				...otherAttributes.style?.dimensions,
				width: `${ width }${ widthUnit }`,
			},
		},
	};
};

// The block shape before `dimensions.width` was adopted. `width` and
// `widthUnit` are still registered on the current block so the server can read
// them from content that has not been re-saved yet, but the editor moves them
// under `style.dimensions.width` on load.
const v1 = {
	attributes: {
		label: {
			type: 'string',
			role: 'content',
		},
		showLabel: {
			type: 'boolean',
			default: true,
		},
		placeholder: {
			type: 'string',
			default: '',
			role: 'content',
		},
		width: {
			type: 'number',
		},
		widthUnit: {
			type: 'string',
		},
		buttonText: {
			type: 'string',
			role: 'content',
		},
		buttonPosition: {
			type: 'string',
			default: 'button-outside',
		},
		buttonUseIcon: {
			type: 'boolean',
			default: false,
		},
		query: {
			type: 'object',
			default: {},
		},
		tagName: {
			type: 'string',
			default: '',
		},
	},
	supports: {
		anchor: true,
		align: [ 'left', 'center', 'right' ],
		color: {
			gradients: true,
			__experimentalSkipSerialization: true,
			__experimentalDefaultControls: {
				background: true,
				text: true,
			},
		},
		interactivity: true,
		typography: {
			__experimentalSkipSerialization: true,
			__experimentalSelector:
				'.wp-block-search__label, .wp-block-search__input, .wp-block-search__button',
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
		__experimentalBorder: {
			color: true,
			radius: true,
			width: true,
			__experimentalSkipSerialization: true,
			__experimentalDefaultControls: {
				color: true,
				radius: true,
				width: true,
			},
		},
		spacing: {
			margin: true,
		},
		html: false,
	},
	migrate: migrateWidth,
	isEligible( { width, widthUnit } ) {
		return !! width && !! widthUnit;
	},
	save: () => null,
};

export default [ v1 ];
