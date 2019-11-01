/**
 * Set the attributes for the Dimension Control
 *
 * @type {Object}
 */
const DimensionsAttributes = {
	responsivePadding: {
		type: 'boolean',
		default: false,
	},
	responsiveMargin: {
		type: 'boolean',
		default: false,
	},
	paddingUnit: {
		type: 'string',
		default: 'px',
	},
	paddingSize: {
		type: 'string',
	},
	paddingSizeSmall: {
		type: 'string',
	},
	paddingSizeMedium: {
		type: 'string',
	},
	marginUnit: {
		type: 'string',
		default: 'px',
	},
	marginSize: {
		type: 'string',
	},
	marginSizeMedium: {
		type: 'string',
	},
	marginSizeSmall: {
		type: 'string',
	},
};

export default DimensionsAttributes;
