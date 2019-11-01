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
		default: '',
	},
	paddingSizeSmall: {
		type: 'string',
		default: '',
	},
	paddingSizeMedium: {
		type: 'string',
		default: '',
	},
	marginUnit: {
		type: 'string',
		default: 'px',
	},
	marginSize: {
		type: 'string',
		default: '',
	},
	marginSizeMedium: {
		type: 'string',
		default: '',
	},
	marginSizeSmall: {
		type: 'string',
		default: '',
	},
};

export default DimensionsAttributes;
