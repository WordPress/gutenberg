import baseConfig from '../../.stylelintrc.js';

const [ disallowedValues, disallowedValueMessages ] =
	baseConfig.rules[ 'declaration-property-value-disallowed-list' ];

// wp-block-library generally should not use theme tokens in most cases.
const { cursor: _ignoredCursorRule, ...blockLibraryDisallowedValues } =
	disallowedValues;

/** @type {import('stylelint').Config} */
export default {
	extends: '../../.stylelintrc.js',
	rules: {
		'declaration-property-value-disallowed-list': [
			blockLibraryDisallowedValues,
			disallowedValueMessages,
		],
	},
};
