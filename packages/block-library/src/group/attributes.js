/**
 * Set the attributes for the Dimension Control
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
	paddingSizeMobile: {
		type: 'string',
	},
	paddingSizeTablet: {
		type: 'string',
	},
	marginUnit: {
		type: 'string',
		default: 'px',
	},
	marginSize: {
		type: 'string',
	},
	marginSizeTablet: {
		type: 'string',
	},
	marginSizeMobile: {
		type: 'string',
	},
};

export default DimensionsAttributes;
